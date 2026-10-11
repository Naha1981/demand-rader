import { analysePermalink, type UrlStatus } from "./permalink.js";
import { scoreIntent, type Intent } from "./score.js";

export type Candidate = { platform: string; url: string; text: string; author?: string; publishedAt?: string; query: string };
export type Lead = { candidate: Candidate; canonicalUrl: string; nativeId?: string | undefined; permalinkOk: boolean; permalinkReason: string; status: UrlStatus; verifyEvidence: string[]; intent: Intent; actionable: boolean; fresh: boolean; inArea: boolean };

/** Fetched page content is passed in by the caller. Need 2 of: native id, distinctive text, author, timestamp. */
export function verifyAgainstPage(c: Candidate, nativeId: string | undefined, page: { ok: boolean; status?: string; text: string } | null): { status: UrlStatus; evidence: string[] } {
  if (!page) return { status: "UNVERIFIED", evidence: [] };
  if (page.status === "login") return { status: "LOGIN_REQUIRED", evidence: [] };
  if (page.status === "group") return { status: "GROUP_ACCESS_REQUIRED", evidence: [] };
  if (page.status === "deleted") return { status: "DELETED", evidence: [] };
  if (!page.ok) return { status: "INACCESSIBLE", evidence: [] };
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ");
  const body = norm(page.text);
  const ev: string[] = [];
  if (nativeId && body.includes(nativeId.toLowerCase())) ev.push("native id on page");
  const snippet = norm(c.text).split(/[.!?\n]/).map((s) => s.trim()).filter((s) => s.length >= 25).sort((a, b) => b.length - a.length)[0];
  if (snippet && body.includes(snippet.slice(0, 80))) ev.push("post text on page");
  if (c.author && body.includes(norm(c.author))) ev.push("author on page");
  if (c.publishedAt && body.includes(c.publishedAt.slice(0, 10))) ev.push("timestamp on page");
  return { status: ev.length >= 2 ? "VERIFIED_ACTIONABLE" : "UNVERIFIED", evidence: ev };
}

export const MAX_AGE_DAYS = 14;
export function buildLead(c: Candidate, page: Parameters<typeof verifyAgainstPage>[2], now: Date = new Date()): Lead {
  const p = analysePermalink(c.url);
  const intent = scoreIntent(c.text);
  // Freshness: a known publish date within MAX_AGE_DAYS. Unknown date = not fresh (UNKNOWN is not TRUE).
  const ts = c.publishedAt ? Date.parse(c.publishedAt) : NaN;
  const fresh = Number.isFinite(ts) && now.getTime() - ts <= MAX_AGE_DAYS * 86400000 && ts <= now.getTime() + 86400000;
  const inArea = !!intent.location;
  let status: UrlStatus = "UNVERIFIED"; let ev: string[] = [];
  if (p.isPostLevel) ({ status, evidence: ev } = verifyAgainstPage(c, p.nativeId, page));
  return { candidate: c, canonicalUrl: p.canonicalUrl, nativeId: p.nativeId, permalinkOk: p.isPostLevel, permalinkReason: p.reason, status, verifyEvidence: ev, intent,
    fresh, inArea,
    actionable: p.isPostLevel && status === "VERIFIED_ACTIONABLE" && intent.role === "BUYER" && intent.score >= 3 && fresh && inArea };
}

export function dedupe(leads: Lead[]): Lead[] {
  const seen = new Map<string, Lead>();
  for (const l of leads) {
    const k = l.nativeId ? `${l.candidate.platform}:${l.nativeId}` : l.canonicalUrl;
    const prev = seen.get(k);
    if (!prev || (l.actionable && !prev.actionable) || l.intent.score > prev.intent.score) seen.set(k, l);
  }
  return [...seen.values()];
}

export type Dealer = { id: string; territories: string[]; verticals: string[]; remaining: number };
/** Route to exactly one dealer, or none. Never broadcast. */
export function routeLead(l: Lead, dealers: Dealer[]): { dealerId: string; why: string } | null {
  if (!l.actionable || !l.intent.vertical) return null;
  const loc = (l.intent.location ?? "").toLowerCase();
  const vertical = l.intent.vertical;
  const fit = dealers.filter((d) => d.remaining > 0 && d.verticals.includes(vertical) && (!loc || d.territories.some((t) => loc.includes(t.toLowerCase()) || t.toLowerCase() === "gauteng")));
  if (!fit.length) return null;
  fit.sort((a, b) => b.remaining - a.remaining || a.id.localeCompare(b.id));
  return { dealerId: fit[0]!.id, why: `${l.intent.vertical} buyer in ${l.intent.location ?? "unknown area"}; dealer covers it with ${fit[0]!.remaining} leads left` };
  }
