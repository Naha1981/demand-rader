import { describe, expect, it } from "vitest";
import type { Business } from "../src/domain/business.js";
import type { Evidence } from "../src/domain/evidence.js";
import type { MarketEvent } from "../src/domain/event.js";
import { weatherOnly } from "../src/models/weather-only.js";
import { weatherConsequence } from "../src/models/weather-consequence.js";
import { behavior } from "../src/models/behavior.js";
import { businessFit } from "../src/models/business-fit.js";

const event: MarketEvent = {
  id: "GE-001",
  eventType: "SEVERE_WEATHER_HAIL",
  title: "Test hail event",
  geographies: ["johannesburg", "midrand"],
  status: "RESOLVED",
  evidenceIds: ["W", "D", "B"],
  demandWindowHours: 336,
  replayCheckpoints: ["2023-11-13T17:36:00Z"],
};

const baseBusiness: Business = {
  id: "B1",
  name: "Roofing Example",
  active: true,
  services: ["roof repair"],
  serviceArea: ["johannesburg", "midrand"],
  emergencyAvailable: true,
  capacity: 5,
  minimumJobValue: 2500,
  preferredJobTypes: ["storm damage"],
};

const evidence: Evidence[] = [
  {
    id: "W",
    source: "Weather",
    sourceUrl: "https://example.com/weather",
    availableAt: "2023-11-13T17:00:00Z",
    signalType: "SEVERE_WEATHER_HAIL",
    geographies: ["johannesburg"],
    independenceGroup: "weather",
    contentHash: "fixture:w",
    epistemicType: "OBSERVED",
    metadata: {},
  },
  {
    id: "D",
    source: "News",
    sourceUrl: "https://example.com/damage",
    availableAt: "2023-11-13T18:00:00Z",
    signalType: "ROOFING_DAMAGE",
    geographies: ["midrand"],
    independenceGroup: "news",
    contentHash: "fixture:d",
    epistemicType: "REPORTED",
    metadata: {},
  },
  {
    id: "B",
    source: "Search",
    sourceUrl: "https://example.com/search",
    availableAt: "2023-11-13T19:00:00Z",
    signalType: "SEARCH_LOCAL_ROOF_REPAIR",
    geographies: ["midrand"],
    independenceGroup: "behavior",
    contentHash: "fixture:b",
    epistemicType: "OBSERVED",
    metadata: { intent: "commercial" },
  },
];

const replayTime = new Date("2023-11-13T19:30:00Z");

describe("Demand Radar models", () => {
  it("Model A fires on qualifying weather evidence", () => {
    expect(weatherOnly(event, evidence, baseBusiness, replayTime).decision)
      .toBe("ACTIONABLE");
  });

  it("Model B does not count one source family as independent corroboration", () => {
    const sameSourceConsequence = evidence.map((item) =>
      item.id === "D"
        ? { ...item, independenceGroup: "weather" }
        : item,
    );

    expect(
      weatherConsequence(
        event,
        sameSourceConsequence,
        baseBusiness,
        replayTime,
      ).decision,
    ).toBe("WATCH");
  });

  it("Model B becomes actionable with independent consequence evidence", () => {
    expect(
      weatherConsequence(event, evidence, baseBusiness, replayTime).decision,
    ).toBe("ACTIONABLE");
  });

  it("Model C treats missing behavior as unknown rather than false", () => {
    const result = behavior(
      event,
      evidence.filter((item) => item.id !== "B"),
      baseBusiness,
      replayTime,
    );

    expect(result.decision).toBe("WATCH");
    expect(result.suppressionReason).toBe("INSUFFICIENT_EVIDENCE");
  });

  it("Model C fires when behavioral evidence is present", () => {
    expect(behavior(event, evidence, baseBusiness, replayTime).decision)
      .toBe("ACTIONABLE");
  });

  it("Model D suppresses zero capacity", () => {
    const result = businessFit(
      event,
      evidence,
      { ...baseBusiness, capacity: 0 },
      replayTime,
    );

    expect(result.decision).toBe("SUPPRESSED");
    expect(result.suppressionReason).toBe("NO_CAPACITY");
  });

  it("wrong geography suppresses", () => {
    const result = weatherOnly(
      event,
      evidence,
      { ...baseBusiness, serviceArea: ["pretoria"] },
      replayTime,
    );

    expect(result.decision).toBe("SUPPRESSED");
    expect(result.suppressionReason).toBe("WRONG_GEOGRAPHY");
  });

  it("no roofing service suppresses", () => {
    const result = weatherOnly(
      event,
      evidence,
      { ...baseBusiness, services: ["plumbing"] },
      replayTime,
    );

    expect(result.decision).toBe("SUPPRESSED");
    expect(result.suppressionReason).toBe("NO_SERVICE_MATCH");
  });
});
