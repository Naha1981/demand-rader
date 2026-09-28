import crypto from "node:crypto";
import { SocialEvidenceSchema, type NormalizedSocialScan, type SocialEvidence } from "./types.js";

type RecordValue = Record<string, unknown>;

function record(value: unknown): RecordValue {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as RecordValue)
    : {};
}

function stringValue(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function arrayOfRecords(value: unknown): RecordValue[] {
  return Array.isArray(value)
    ? value.filter((item): item is RecordValue => item !== null && typeof item === "object" && !Array.isArray(item))
    : [];
}

function hash(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function normalizeUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    url.hash = "";
    return url.href;
  } catch {
    return null;
  }
}

function accessState(status: string, reason: string): SocialEvidence["accessState"] {
  const combined = (status + " " + reason).toLowerCase();

  if (combined.includes("login") || combined.includes("sign in") || combined.includes("authenticated")) return "LOGIN_REQUIRED";
  if (combined.includes("challenge") || combined.includes("captcha") || combined.includes("verification")) return "CHALLENGE";
  if (combined.includes("rate limit") || combined.includes("rate_limited") || combined.includes("too many requests")) return "RATE_LIMITED";
  if (combined.includes("forbidden") || combined.includes("access denied") || combined.includes("blocked")) return "BLOCKED";
  if (status === "partial" || status === "interrupted" || status === "incomplete" || status === "error") return "INCOMPLETE";
  return "PUBLIC";
}

function sourceType(url: string): SocialEvidence["sourceType"] {
  try {
    const pathname = new URL(url).pathname;
    if (/\/status\/\d+/.test(pathname)) return "post";
    if (/^\/[^/]+\/?$/.test(pathname)) return "profile";
  } catch {
    // URL validity is checked before this function is called.
  }
  return "result";
}

function textFromItem(item: RecordValue): string {
  return stringValue(item.text, item.full_text, item.note_tweet_text, item.description, item.title) ?? "";
}

function itemsFromInput(input: unknown): RecordValue[] {
  if (Array.isArray(input)) return arrayOfRecords(input);

  const root = record(input);
  return arrayOfRecords(
    root.items ??
      root.results ??
      root.tweets ??
      root.data ??
      record(root.result).items ??
      record(root.result).tweets,
  );
}

export function normalizeXScraperRun(
  input: unknown,
  observedAt = new Date(),
): NormalizedSocialScan {
  const run = record(input);
  const status = stringValue(run.status) ?? "completed";
  const stopReason = stringValue(run.stopReason, run.error, run.message);
  const observedIso = observedAt.toISOString();
  const items = itemsFromInput(input);
  const seen = new Set<string>();
  const access = accessState(status, stopReason ?? "");
  const evidence: SocialEvidence[] = [];

  for (const item of items) {
    const url = normalizeUrl(stringValue(item.url, item.web_url, item.link) ?? "");
    if (!url || seen.has(url)) continue;
    seen.add(url);

    const author = record(item.author);
    const authorId = stringValue(
      item.author_id,
      item.authorId,
      author.id,
      author.username,
      author.screen_name,
    );
    const authorName = stringValue(
      item.author_name,
      item.authorName,
      author.name,
      author.username,
      author.screen_name,
    );
    const text = textFromItem(item);
    const publishedAtRaw = stringValue(item.created_at, item.createdAt, item.published_at, item.publishedAt);
    const publishedAt =
      publishedAtRaw && !Number.isNaN(Date.parse(publishedAtRaw))
        ? new Date(publishedAtRaw).toISOString()
        : undefined;
    const capturedAtRaw = stringValue(item.scraped_at, item.scrapedAt);
    const capturedAt =
      capturedAtRaw && !Number.isNaN(Date.parse(capturedAtRaw))
        ? new Date(capturedAtRaw).toISOString()
        : observedIso;

    const candidate: SocialEvidence = {
      id: "social_" + hash("x|" + url).slice(0, 20),
      platform: "x",
      sourceUrl: url,
      sourceType: sourceType(url),
      ...(authorId ? { authorId } : {}),
      ...(authorName ? { authorName } : {}),
      text,
      ...(publishedAt ? { publishedAt } : {}),
      observedAt: observedIso,
      availableAt: capturedAt,
      geographies: [],
      independenceGroup: "social:x:" + (authorId ?? new URL(url).hostname),
      contentHash: hash(["x", url, text].join("|")),
      epistemicType: "OBSERVED",
      accessState: access,
      metadata: {
        query: stringValue(run.query, run.search),
        tweetId: stringValue(item.id, item.tweet_id),
        language: stringValue(item.lang, item.language),
        metrics: item.metrics ?? undefined,
        hashtags: item.hashtags ?? undefined,
        mediaCount: Array.isArray(item.media) ? item.media.length : undefined,
      },
    };

    evidence.push(SocialEvidenceSchema.parse(candidate));
  }

  return {
    runId: stringValue(run.id) ?? "x_" + hash(observedIso + "|" + String(run.query ?? "")).slice(0, 20),
    platform: "x",
    source: "x",
    status,
    ...(stopReason ? { stopReason } : {}),
    evidence,
    accessState: access,
  };
}
