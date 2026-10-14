import { readFileSync, writeFileSync } from "node:fs";
import { buildLead, dedupe, type Candidate } from "./pipeline.js";
type In = { candidate: Candidate; page: { ok: boolean; status?: string; text: string } | null };
const rows: In[] = JSON.parse(readFileSync(process.argv[2]!, "utf8"));
const leads = dedupe(rows.map((r) => buildLead(r.candidate, r.page)));
const count = (f: (l: (typeof leads)[number]) => boolean) => leads.filter(f).length;
const byPlat: Record<string, any> = {};
for (const l of leads) { const p = (byPlat[l.candidate.platform] ??= { candidates: 0, postLevel: 0, verified: 0, buyer: 0, actionable: 0 }); p.candidates++; if (l.permalinkOk) p.postLevel++; if (l.status === "VERIFIED_ACTIONABLE") p.verified++; if (l.intent.role === "BUYER" && l.intent.score >= 3) p.buyer++; if (l.actionable) p.actionable++; }
const summary = { attempted: rows.length, afterDedupe: leads.length, postLevelPermalink: count((l) => l.permalinkOk), verified: count((l) => l.status === "VERIFIED_ACTIONABLE"), buyerIntent3plus: count((l) => l.intent.role === "BUYER" && l.intent.score >= 3), actionable: count((l) => l.actionable), byPlatform: byPlat };
writeFileSync(process.argv[3]!, JSON.stringify({ summary, leads }, null, 1));
console.log(JSON.stringify(summary, null, 1));
