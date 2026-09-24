import { describe, expect, it } from "vitest";
import { evidenceAvailableAt } from "../src/replay/evidence-filter.js";
import type { Evidence } from "../src/domain/evidence.js";

const evidence: Evidence[] = [
  {
    id: "E-001",
    source: "A",
    sourceUrl: "https://example.com/1",
    availableAt: "2023-11-13T17:36:00Z",
    signalType: "SEVERE_WEATHER_HAIL",
    geographies: ["johannesburg"],
    independenceGroup: "source-a",
    contentHash: "fixture:1",
    epistemicType: "REPORTED",
    metadata: {},
  },
  {
    id: "E-002",
    source: "B",
    sourceUrl: "https://example.com/2",
    availableAt: "2023-11-14T14:10:00Z",
    signalType: "ROOFING_DAMAGE",
    geographies: ["johannesburg"],
    independenceGroup: "source-b",
    contentHash: "fixture:2",
    epistemicType: "REPORTED",
    metadata: {},
  },
];

describe("historical replay", () => {
  it("does not allow future evidence into an earlier replay", () => {
    const result = evidenceAvailableAt(
      evidence,
      new Date("2023-11-13T20:00:00Z"),
    );

    expect(result.map((item) => item.id)).toEqual(["E-001"]);
  });

  it("is independent of input ordering", () => {
    const a = evidenceAvailableAt(
      evidence,
      new Date("2023-11-14T16:00:00Z"),
    );
    const b = evidenceAvailableAt(
      [...evidence].reverse(),
      new Date("2023-11-14T16:00:00Z"),
    );

    expect(a.map((x) => x.id).sort()).toEqual(
      b.map((x) => x.id).sort(),
    );
  });
});
