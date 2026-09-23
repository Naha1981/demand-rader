import { describe, expect, it } from "vitest";
import type { Business } from "../src/domain/business.js";
import type { Evidence } from "../src/domain/evidence.js";
import type { MarketEvent } from "../src/domain/event.js";
import { weatherConsequence } from "../src/models/weather-consequence.js";

const event: MarketEvent = {
  id: "GE-TEST",
  eventType: "SEVERE_WEATHER_HAIL",
  title: "Determinism event",
  geographies: ["johannesburg"],
  status: "RESOLVED",
  evidenceIds: ["W", "D"],
  demandWindowHours: 336,
  replayCheckpoints: ["2023-11-13T20:00:00Z"],
};

const business: Business = {
  id: "B1",
  name: "Roofing Example",
  active: true,
  services: ["roof repair"],
  serviceArea: ["johannesburg"],
  emergencyAvailable: true,
  capacity: 5,
  minimumJobValue: 2500,
  preferredJobTypes: ["storm damage"],
};

const evidence: Evidence[] = [
  {
    id: "W",
    source: "Weather",
    sourceUrl: "https://example.com/w",
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
    sourceUrl: "https://example.com/d",
    availableAt: "2023-11-13T18:00:00Z",
    signalType: "ROOFING_DAMAGE",
    geographies: ["johannesburg"],
    independenceGroup: "news",
    contentHash: "fixture:d",
    epistemicType: "REPORTED",
    metadata: {},
  },
];

describe("deterministic replay", () => {
  it("returns identical decisions for identical inputs", () => {
    const a = weatherConsequence(
      event,
      evidence,
      business,
      new Date("2023-11-13T20:00:00Z"),
    );
    const b = weatherConsequence(
      event,
      evidence,
      business,
      new Date("2023-11-13T20:00:00Z"),
    );

    expect(a).toEqual(b);
  });

  it("is idempotent for the same replay", () => {
    const first = weatherConsequence(
      event,
      evidence,
      business,
      new Date("2023-11-13T20:00:00Z"),
    );
    const second = weatherConsequence(
      event,
      evidence,
      business,
      new Date("2023-11-13T20:00:00Z"),
    );

    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });
});
