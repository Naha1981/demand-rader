import crypto from "node:crypto";
import {
  SocialEvidenceSchema,
  SocialPlatformSchema,
  type JevSocialRun,
  type NormalizedSocialScan,
  type SocialEvidence,
  type SocialPlatform,
} from "./types.js";

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

function sourceType(platform: SocialPlatform, url: string): SocialEvidence["sourceType"] {
  const pathname = new URL(url).pathname;
  if (platform === "instagram") {
    if (/^\/(?:p|reel)\//.test(pathname)) return "post";
    return "profile";
  }
  if (platform === "tiktok") {
    if (/\/video\/\d+/.test(pathname)) return "post";
    return "profile";
  }
  if (platform === "linkedin") {
    if (/^\/(?:posts|feed\/update)\//.test(pathname)) return "post";
    if (/^\/(?:company|showcase)\//.test(pathname)) return "company";
    return "profile";
  }
  if (/\/status\/\d+/.test(pathname)) return "post";
  if (/^\/[^/]+\/?$/.test(pathname)) return "profile";
  return "result";
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

function textFromItem(item: RecordValue): string {
  const base = stringValue(
    item.text,
    item.caption,
    item.description,
    item.title,
    item.subtitle,
    item.bio,
  );
  const comments = arrayOfRecords(item.comments ?? item.top_comments)
    .slice(0, 8)
    .map((comment) => stringValue(comment.text, comment.content))
    .filter((value): value is string => Boolean(value));

  return [base, ...comments].filter(Boolean).join("\n").trim();
}

function accessState(run: JevSocialRun): SocialEvidence["accessState"] {
  const status = String(run.status ?? "").toLowerCase();
  const reason = String(run.stopReason ?? "").toLowerCase();

  if (reason.includes("login") || reason.includes("sign in")) return "LOGIN_REQUIRED";
  if (reason.includes("challenge") || reason.includes("captcha")) return "CHALLENGE";
  if (reason.includes("rate limit") || reason.includes("rate_limited")) return "RATE_LIMITED";
  if (status.includes("blocked") || reason.includes("access denied")) return "BLOCKED";
  if (status === "partial" || status === "interrupted" || status === "decision_failed") return "INCOMPLETE";
  return "PUBLIC";
}

export function normalizeJevSocialRun(
  input: unknown,
  observedAt = new Date(),
): NormalizedSocialScan {
  const run = input as JevSocialRun;
  const platform = SocialPlatformSchema.exclude(["x"]).parse(
    String(run.platform ?? run.requestedPlatform ?? "instagram"),
  ) as Exclude<SocialPlatform, "x">;
  const result = record(run.result);
  const items = arrayOfRecords(result.items);
  const seen = new Set<string>();
  const observedIso = observedAt.toISOString();
  const availableAt =
    typeof run.createdAt === "string" && !Number.isNaN(Date.parse(run.createdAt))
      ? new Date(run.createdAt).toISOString()
      : observedIso;
  const access = accessState(run);

  const evidence: SocialEvidence[] = [];

  for (const item of items) {
    const url = normalizeUrl(stringValue(item.url, item.web_url, item.share_url) ?? "");
    if (!url || seen.has(url)) continue;
    seen.add(url);

    const author = record(item.author);
    const authorId = stringValue(item.author_id, item.authorId, author.id, author.username, author.url);
    const authorName = stringValue(item.author_name, item.authorName, author.name, author.username);
    const text = textFromItem(item);
    const contentHash = hash([platform, url, text].join("|"));
    const publishedAtRaw = stringValue(item.published_at, item.publishedAt, item.timestamp, item.date);
    const publishedAt =
      publishedAtRaw && !Number.isNaN(Date.parse(publishedAtRaw))
        ? new Date(publishedAtRaw).toISOString()
        : undefined;

    const candidate: SocialEvidence = {
      id: "social_" + hash(platform + "|" + url).slice(0, 20),
      platform,
      sourceUrl: url,
      sourceType: sourceType(platform, url),
      ...(authorId ? { authorId } : {}),
      ...(authorName ? { authorName } : {}),
      text,
      ...(publishedAt ? { publishedAt } : {}),
      observedAt: observedIso,
      availableAt,
      geographies: [],
      independenceGroup: "social:" + platform + ":" + (authorId ?? new URL(url).hostname),
      contentHash,
      epistemicType: "OBSERVED",
      accessState: access,
      metadata: {
        runId: String(run.id ?? ""),
        detailRead: Boolean(item.detail_read),
        rawKind: stringValue(item.kind),
      },
    };

    evidence.push(SocialEvidenceSchema.parse(candidate));
  }

  return {
    runId: String(run.id ?? "social_" + hash(observedIso + "|" + String(result.query ?? "")).slice(0, 20)),
    platform,
    source: "jev",
    status: String(run.status ?? "unknown"),
    ...(run.stopReason ? { stopReason: String(run.stopReason) } : {}),
    evidence,
    accessState: access,
    ...(typeof run.elapsedMs === "number" ? { elapsedMs: run.elapsedMs } : {}),
  };
}
