import { describe, expect, it } from "vitest";
import { EvidenceSchema } from "../src/domain/evidence.js";
import { normalizeXScraperRun } from "../src/social/normalize-x.js";
import { toDemandRadarEvidence } from "../src/social/bridge.js";
import { evaluateRoofingSignal } from "../src/social/policy.js";

describe("X social evidence normalization", () => {
  it("normalizes tweet records and preserves scrape availability time", () => {
    const scan = normalizeXScraperRun(
      [
        {
          id: "1846987139428634858",
          url: "https://x.com/example/status/1846987139428634858",
          created_at: "2026-09-28T06:00:00.000Z",
          scraped_at: "2026-09-28T07:00:00.000Z",
          text: "Anyone know a reliable roofer in Soweto?",
          author: { username: "example", name: "Example" },
          metrics: { replies: 2, likes: 10 },
        },
        {
          id: "1846987139428634858",
          url: "https://x.com/example/status/1846987139428634858#comments",
          created_at: "2026-09-28T06:00:00.000Z",
          scraped_at: "2026-09-28T07:00:00.000Z",
          text: "Anyone know a reliable roofer in Soweto?",
          author: { username: "example", name: "Example" },
        },
      ],
      new Date("2026-09-28T07:05:00.000Z"),
    );

    expect(scan.platform).toBe("x");
    expect(scan.evidence).toHaveLength(1);
    expect(scan.evidence[0]?.sourceUrl).toBe("https://x.com/example/status/1846987139428634858");
    expect(scan.evidence[0]?.publishedAt).toBe("2026-09-28T06:00:00.000Z");
    expect(scan.evidence[0]?.availableAt).toBe("2026-09-28T07:00:00.000Z");
    expect(scan.evidence[0]?.authorId).toBe("example");
  });

  it("classifies login failure as an access boundary", () => {
    const scan = normalizeXScraperRun({
      status: "error",
      stopReason: "X login required before searching.",
      items: [],
    });

    expect(scan.accessState).toBe("LOGIN_REQUIRED");
    expect(scan.evidence).toHaveLength(0);
  });
});

describe("X evidence in Demand Radar", () => {
  it("supports the same roofing policy and core evidence bridge", () => {
    const evidence = normalizeXScraperRun(
      {
        status: "completed",
        query: "roofer Soweto",
        items: [
          {
            id: "1",
            url: "https://x.com/example/status/1",
            text: "Anyone know a reliable roofer in Soweto?",
            created_at: "2026-09-28T06:00:00.000Z",
            scraped_at: "2026-09-28T07:00:00.000Z",
            author: { username: "example" },
          },
        ],
      },
      new Date("2026-09-28T07:05:00.000Z"),
    ).evidence[0];

    expect(evidence).toBeDefined();

    const signal = evaluateRoofingSignal(evidence!, {
      geographyTerms: ["Soweto"],
      requireGeographyForCandidate: true,
    });
    const mapped = toDemandRadarEvidence(evidence!, signal);

    expect(signal.signalType).toBe("EXPLICIT_SERVICE_REQUEST");
    expect(signal.candidateForOpportunity).toBe(true);
    expect(mapped.source).toBe("social:x");
    expect(EvidenceSchema.parse(mapped)).toEqual(mapped);
  });
});
