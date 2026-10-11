export type Vertical = "car" | "property";
export type Intent = { vertical?: Vertical | undefined; role: "BUYER" | "SELLER" | "UNKNOWN"; score: 0 | 1 | 2 | 3 | 4 | 5; excerpt: string; budget?: string | undefined; location?: string | undefined; reasons: string[] };

const CAR = /\b(bakkie|car|suv|hatchback|sedan|vehicle|toyota|vw|polo|hilux|ranger|corolla|fortuner|suzuki|ford|bmw|merc|audi|hyundai|kia|nissan)\b/i;
const PROP = /\b(\d\s?-?\s?(bed|bedroom)s?|flat|apartment|house|townhouse|bachelor|room|rent|rental|property|cottage)\b/i;
const ADVERT_LOOKING = /\b(anyone|those|people|buyers?|families|professionals|investors) (?:who(?:'re| are) )?looking (?:for|to)\b/i;
const BUYER = /\b(looking for|wanted|want to buy|need(?:s|ed)? (?:a|an|to buy)|in the market for|anyone selling|who is selling|searching for|looking to (?:buy|rent)|seeking|budget)\b/i;
const SELLER = /(#\w*(forsale|tolet|forrent)|\bperfect for\b|\bm²|\d\s?m2\b|\bbook (?:a )?viewing|\bcomplex\b|\bhttps?:\/\/|\bfor sale|\bselling|\bwe (?:have|offer)\b|\bour (?:units|stock|range)\b|\bexclusive\b|\bavailable now|to let|price:|contact (?:me|us)|call us|dm for|no deposit|finance available)\b/i;
const REC = /\b(recommend|any(?:one)? know|dealer(?:s)? (?:in|near)|where can i)\b/i;
const URGENT = /\b(urgent|asap|immediately|this week|today|by month end)\b/i;
const BUDGET = /(?:budget|under|max|up to|around)\s*(?:of\s*)?R\s?\d[\d\s,.]*k?|R\s?\d[\d\s,.]*k?\s*(?:budget|max)/i;
const LOC = /\b(johannesburg|jhb|jozi|sandton|soweto|randburg|midrand|pretoria|centurion|fourways|roodepoort|benoni|boksburg|germiston|alberton|kempton park|gauteng|bryanston|rosebank|bedfordview|edenvale|springs|vereeniging|krugersdorp)\b/i;

export function scoreIntent(text: string): Intent {
  const t = text.replace(/\s+/g, " ").trim();
  const vertical: Vertical | undefined = PROP.test(t) && !/\b(bakkie|hilux|polo)\b/i.test(t) ? "property" : CAR.test(t) ? "car" : undefined;
  const buyer = BUYER.test(t.replace(ADVERT_LOOKING, " ")), seller = SELLER.test(t), rec = REC.test(t);
  const reasons: string[] = [];
  const budget = t.match(BUDGET)?.[0];
  const location = t.match(LOC)?.[0];
  const m = t.match(BUYER) ?? t.match(REC);
  const idx = m?.index ?? 0;
  const excerpt = t.slice(Math.max(0, idx - 40), idx + 160);
  if (!vertical) return { role: "UNKNOWN", score: 0, excerpt, reasons: ["no car or property term"] };
  if (seller && !buyer) return { vertical, role: "SELLER", score: 0, excerpt: t.slice(0, 160), reasons: ["reads as seller advert, not a buyer"] };
  if (!buyer && !rec) return { vertical, role: "UNKNOWN", score: 1, excerpt: t.slice(0, 160), reasons: ["topic match only, no buying request"] };
  let s = 3; reasons.push(buyer ? "explicit buying/renting request" : "recommendation request");
  if (buyer && (budget || location)) { s = 4; reasons.push("concrete need: " + [budget, location].filter(Boolean).join(", ")); }
  if (buyer && budget && location && URGENT.test(t)) { s = 5; reasons.push("urgent"); }
  else if (buyer && budget && location) { s = 5; reasons.push("budget and location both stated"); }
  if (seller && buyer) { s = Math.min(s, 3) as number; reasons.push("also reads like an advert, capped"); }
  return { vertical, role: "BUYER", score: s as Intent["score"], excerpt, budget, location, reasons };
}
