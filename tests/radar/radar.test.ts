import { describe, it, expect } from "vitest";
import { analysePermalink } from "../../src/radar/permalink.js";
import { scoreIntent } from "../../src/radar/score.js";
import { buildLead, dedupe, routeLead, verifyAgainstPage } from "../../src/radar/pipeline.js";

// FIXTURES: synthetic, labelled DEMO. Not live leads.
const DEMO_BUYER = "DEMO: Looking for a Toyota Hilux bakkie, budget R180k, Johannesburg. Need it this week please";
const DEMO_SELLER = "DEMO: 2016 Toyota Hilux for sale, finance available, call us today";

describe("permalink gate", () => {
  it("rejects profile/search/group-home URLs", () => {
    for (const u of ["https://www.facebook.com/groups/123456", "https://x.com/someone", "https://www.instagram.com/somedealer/", "https://www.facebook.com/search/posts?q=bakkie", "https://www.tiktok.com/@a", "https://www.linkedin.com/company/x"])
      expect(analysePermalink(u).isPostLevel, u).toBe(false);
  });
  it("accepts post-level URLs and canonicalises", () => {
    expect(analysePermalink("https://m.facebook.com/groups/99/posts/12345/?mibextid=x")).toMatchObject({ platform: "facebook", nativeId: "12345", isPostLevel: true });
    expect(analysePermalink("https://twitter.com/a/status/987654321?s=20")).toMatchObject({ platform: "x", nativeId: "987654321", canonicalUrl: "https://x.com/a/status/987654321" });
    expect(analysePermalink("https://www.instagram.com/p/AbC_12/?igshid=1")).toMatchObject({ platform: "instagram", nativeId: "AbC_12" });
    expect(analysePermalink("https://www.reddit.com/r/southafrica/comments/abc123/title/")).toMatchObject({ platform: "reddit", nativeId: "abc123" });
  });
});

describe("intent score", () => {
  it("scores explicit buyer with budget+location high", () => { const s = scoreIntent(DEMO_BUYER); expect(s.role).toBe("BUYER"); expect(s.vertical).toBe("car"); expect(s.score).toBe(5); expect(s.excerpt).toMatch(/Looking for/); });
  it("does not treat seller adverts as demand", () => { const s = scoreIntent(DEMO_SELLER); expect(s.role).toBe("SELLER"); expect(s.score).toBe(0); });
  it("property buyer", () => { const s = scoreIntent("DEMO: Looking for a 2 bedroom flat in Randburg, budget R7k"); expect(s.vertical).toBe("property"); expect(s.score).toBeGreaterThanOrEqual(4); });
  it("regression: agent advert saying 'anyone looking for' is not a buyer", () => {
    const s = scoreIntent("Modern 2 Bedrooms 2 Bathrooms 108m² R1,450,000 Perfect for professionals, young families or anyone looking for a lock-up-and-go close to Sandton #TownhouseForSale");
    expect(s.role).not.toBe("BUYER"); expect(s.score).toBeLessThan(3);
  });
  it("unrelated text is 0", () => expect(scoreIntent("lovely weather today").score).toBe(0));
  it("topic only is 1", () => expect(scoreIntent("The new Hilux was reviewed this week").score).toBe(1));
});

describe("verification and routing", () => {
  const c = { platform: "facebook", url: "https://www.facebook.com/groups/99/posts/12345/", text: DEMO_BUYER, author: "Demo Buyer", query: "q" };
  it("needs 2 of id/text/author/timestamp", () => {
    expect(verifyAgainstPage(c, "12345", { ok: true, text: "post 12345" }).status).toBe("UNVERIFIED");
    expect(verifyAgainstPage(c, "12345", { ok: true, text: "post 12345 by Demo Buyer" }).status).toBe("VERIFIED_ACTIONABLE");
  });
  it("HTTP ok alone is never proof; login wall is labelled", () => {
    expect(buildLead(c, { ok: true, text: "nothing relevant" }).actionable).toBe(false);
    expect(buildLead(c, { ok: false, status: "login", text: "" }).status).toBe("LOGIN_REQUIRED");
  });
  it("stale, undated or out-of-area posts are never actionable", () => {
    const pg = { ok: true, text: "12345 Demo Buyer" };
    const now = new Date("2026-10-11T12:00:00Z");
    expect(buildLead({ ...c, publishedAt: "2026-10-09T08:00:00Z" }, pg, now).actionable).toBe(true);
    expect(buildLead({ ...c, publishedAt: "2019-05-24T08:00:00Z" }, pg, now).actionable).toBe(false);
    expect(buildLead(c, pg, now).actionable).toBe(false);
    expect(buildLead({ ...c, publishedAt: "2026-10-09T08:00:00Z", text: "DEMO: Looking for a car, budget $4500, San Diego" }, pg, now).actionable).toBe(false);
  });
  it("profile URL can never be actionable", () => { expect(buildLead({ ...c, url: "https://www.facebook.com/groups/99" }, { ok: true, text: DEMO_BUYER + " 99 Demo Buyer" }).actionable).toBe(false); });
  it("dedupes and routes to exactly one dealer", () => {
    const l = buildLead({ ...c, publishedAt: new Date().toISOString() }, { ok: true, text: "12345 Demo Buyer" });
    expect(l.actionable).toBe(true);
    expect(dedupe([l, { ...l }])).toHaveLength(1);
    const r = routeLead(l, [{ id: "A", territories: ["Sandton"], verticals: ["car"], remaining: 5 }, { id: "B", territories: ["Johannesburg"], verticals: ["car"], remaining: 3 }, { id: "C", territories: ["Johannesburg"], verticals: ["property"], remaining: 9 }]);
    expect(r?.dealerId).toBe("B");
    expect(routeLead(l, [{ id: "D", territories: ["Cape Town"], verticals: ["car"], remaining: 5 }])).toBeNull();
  });
});
