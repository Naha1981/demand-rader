import { describe, expect, it } from "vitest";
import type { Business } from "../src/domain/business.js";
import type { Evidence } from "../src/domain/evidence.js";
import type { MarketEvent } from "../src/domain/event.js";
import { behavior } from "../src/models/behavior.js";
import { weatherOnly } from "../src/models/weather-only.js";

const event: MarketEvent = {
  id: "E",
  eventType: "SEVERE_WEATHER_HAIL",
  title: "Invariant event",
  geographies: ["johannesburg"],
  status: "RESOLVED",
  evidenceIds: ["W"],
  demandWindowHours: 336,
  replayCheckpoints: ["2023-11-13T17:36:00Z"],
};

const business: Business = {
  id: "B",
  name: "Roofing business",
  active: true,
  services: ["roof repair"],
  serviceArea: ["johannesburg"],
  emergencyAvailable: true,
  capacity: 1,
  minimumJobValue: 2500,
  preferredJobTypes: ["storm damage"],
};

const weather: Evidence = {
  id: "W",
  source: "weather",
  sourceUrl: "https://example.com/weather",
  availableAt: "2023-11-13T17:00:00Z",
  signalType: "SEVERE_WEATHER_HAIL",
  geographies: ["johannesburg"],
  independenceGroup: "weather",
  contentHash: "fixture:w",
  epistemicType: "OBSERVED",
  metadata: {},
};

describe("core invariants", () => {
  it("missing behavior remains UNKNOWN/WATCH", () => {
    const result = behavior(
      event,
      [weather],
      business,
      new Date("2023-11-13T17:36:00Z"),
    );
    expect(result.decision).toBe("WATCH");
    expect(result.suppressionReason).toBe("INSUFFICIENT_EVIDENCE");
  });

  it("inactive providers cannot become actionable", () => {
    const result = weatherOnly(
      event,
      [weather],
      { ...business, active: false },
      new Date("2023-11-13T17:36:00Z"),
    );
    expect(result.decision).toBe("SUPPRESSED");
  });

  it("replay is deterministic", () => {
    const a = weatherOnly(
      event,
      [weather],
      business,
      new Date("2023-11-13T17:36:00Z"),
    );
    const b = weatherOnly(
      event,
      [weather],
      business,
      new Date("2023-11-13T17:36:00Z"),
    );
    expect(a).toEqual(b);
  });
  it("models cannot use evidence that is still in the future", () => {
    const futureConsequence: Evidence = {
      id: "F",
      source: "future",
      sourceUrl: "https://example.com/future",
      availableAt: "2023-11-13T22:00:00Z",
      signalType: "ROOFING_DAMAGE",
      geographies: ["johannesburg"],
      independenceGroup: "future-source",
      contentHash: "fixture:f",
      epistemicType: "REPORTED",
      metadata: {},
    };

    const eventWithFutureEvidence: MarketEvent = {
      ...event,
      evidenceIds: ["W", "F"],
    };

    const result = weatherOnly(
      eventWithFutureEvidence,
      [weather, futureConsequence],
      business,
      new Date("2023-11-13T20:00:00Z"),
    );

    expect(result.evidenceIds).toEqual(["W"]);
    expect(result.decision).toBe("ACTIONABLE");
  });

});
