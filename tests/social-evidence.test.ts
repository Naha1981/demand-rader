import { describe, expect, it } from "vitest";
import { EvidenceSchema } from "../src/domain/evidence.js";
import { normalizeJevSocialRun } from "../src/social/normalize.js";
import { toDemandRadarEvidence } from "../src/social/bridge.js";
import { evaluateRoofingSignal } from "../src/social/policy.js";

describe("social evidence normalization", () => {
  it("deduplicates source URLs and preserves provenance", () => {
    const run = {
      id: "run-001",
      createdAt: "2026-09-28T07:00:00.000Z",
      platform: "instagram",
      status: "completed",
      result: {
        query: "roof repair Johannesburg",
        items: [
          {
            url: "https://www.instagram.com/p/ABC123/",
            caption: "Need someone to repair my roof in Johannesburg",
            published_at: "2026-09-28T06:00:00.000Z",
            author: { id: "user-1", username: "example" },
          },
          {
            url: "https://www.instagram.com/p/ABC123/#comments",
            caption: "Need someone to repair my roof in Johannesburg",
            published_at: "2026-09-28T06:00:00.000Z",
            author: { id: "user-1", username: "example" },
          },
        ],
      },
    };

    const scan = normalizeJevSocialRun(run, new Date("2026-09-28T07:10:00.000Z"));

    expect(scan.evidence).toHaveLength(1);
    expect(scan.evidence[0]?.sourceUrl).toBe("https://www.instagram.com/p/ABC123/");
    expect(scan.evidence[0]?.availableAt).toBe("2026-09-28T07:00:00.000Z");
    expect(scan.evidence[0]?.independenceGroup).toContain("user-1");
  });

  it("preserves blocked/login access boundaries", () => {
    const scan = normalizeJevSocialRun({
      id: "run-005",
      createdAt: "2026-09-28T07:00:00.000Z",
      platform: "instagram",
      status: "blocked",
      stopReason: "Login required",
      result: { items: [] },
    });

    expect(scan.accessState).toBe("LOGIN_REQUIRED");
  });
});

describe("roofing social policy", () => {
  it("creates a candidate only for an explicit service request with configured geography", () => {
    const evidence = normalizeJevSocialRun(
      {
        id: "run-002",
        createdAt: "2026-09-28T07:00:00.000Z",
        platform: "linkedin",
        status: "completed",
        result: {
          items: [
            {
              url: "https://www.linkedin.com/posts/example_123/",
              text: "Gauteng: can anyone recommend a roofer for hail damage?",
              published_at: "2026-09-28T06:30:00.000Z",
              author: { id: "user-2", name: "Example" },
            },
          ],
        },
      },
      new Date("2026-09-28T07:05:00.000Z"),
    ).evidence[0];

    expect(evidence).toBeDefined();
    const signal = evaluateRoofingSignal(evidence!, {
      geographyTerms: ["Gauteng"],
      requireGeographyForCandidate: true,
    });

    expect(signal.signalType).toBe("EXPLICIT_SERVICE_REQUEST");
    expect(signal.demandState).toBe("SERVICE_INTEREST");
    expect(signal.geographyMatched).toBe(true);
    expect(signal.candidateForOpportunity).toBe(true);
    expect(signal.requiresHumanReview).toBe(true);
  });

  it("does not convert a damage report into a demand candidate", () => {
    const evidence = normalizeJevSocialRun({
      id: "run-003",
      createdAt: "2026-09-28T07:00:00.000Z",
      platform: "tiktok",
      status: "completed",
      result: {
        items: [
          {
            url: "https://www.tiktok.com/@example/video/123456789",
            text: "Hail damaged our roof last night in Pretoria.",
            author: { id: "user-3" },
          },
        ],
      },
    }).evidence[0];

    expect(evidence).toBeDefined();
    const signal = evaluateRoofingSignal(evidence!, {
      geographyTerms: ["Pretoria"],
    });

    expect(signal.signalType).toBe("DAMAGE_REPORT");
    expect(signal.demandState).toBe("INFORMATION_ONLY");
    expect(signal.candidateForOpportunity).toBe(false);
  });

  it("keeps explicit service interest as non-candidate when geography is missing", () => {
    const evidence = normalizeJevSocialRun({
      id: "run-004",
      createdAt: "2026-09-28T07:00:00.000Z",
      platform: "instagram",
      status: "completed",
      result: {
        items: [
          {
            url: "https://www.instagram.com/p/XYZ789/",
            caption: "Need a roofer to repair this leak.",
            author: { id: "user-4" },
          },
        ],
      },
    }).evidence[0];

    expect(evidence).toBeDefined();
    const signal = evaluateRoofingSignal(evidence!, {
      geographyTerms: ["Gauteng"],
    });

    expect(signal.demandState).toBe("SERVICE_INTEREST");
    expect(signal.geographyMatched).toBe(false);
    expect(signal.candidateForOpportunity).toBe(false);
  });

  it("maps social evidence into the core Demand Radar evidence schema", () => {
    const evidence = normalizeJevSocialRun({
      id: "run-006",
      createdAt: "2026-09-28T07:00:00.000Z",
      platform: "instagram",
      status: "completed",
      result: {
        items: [
          {
            url: "https://www.instagram.com/p/BRIDGE1/",
            caption: "Gauteng: can anyone recommend a roofer?",
            author: { id: "user-6", username: "example" },
          },
        ],
      },
    }).evidence[0];

    expect(evidence).toBeDefined();
    const signal = evaluateRoofingSignal(evidence!, {
      geographyTerms: ["Gauteng"],
    });
    const mapped = toDemandRadarEvidence(evidence!, signal);

    expect(EvidenceSchema.parse(mapped)).toEqual(mapped);
    expect(mapped.source).toBe("social:instagram");
    expect(mapped.sourceUrl).toBe("https://www.instagram.com/p/BRIDGE1/");
    expect(mapped.signalType).toBe("EXPLICIT_SERVICE_REQUEST");
    expect(mapped.epistemicType).toBe("OBSERVED");
    expect(mapped.metadata).toMatchObject({
      demandState: "SERVICE_INTEREST",
      candidateForOpportunity: true,
      requiresHumanReview: true,
    });
  });
});
