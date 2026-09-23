import type { Business } from "../domain/business.js";
import type { Evidence } from "../domain/evidence.js";
import type { MarketEvent } from "../domain/event.js";
import type { DemandDecision } from "../domain/decision.js";
import { ROOF_001 } from "../rules/roof-001.js";
import {
  MODEL_VERSION,
  commonGates,
  decision,
  evidenceForEvent,
  suppressionForCommonGate,
} from "./common.js";

export function weatherOnly(
  event: MarketEvent,
  evidence: Evidence[],
  business: Business,
  replayTime: Date,
): DemandDecision {
  const available = evidenceForEvent(event, evidence, replayTime);
  const gates = commonGates(event, business, replayTime);
  const suppression = suppressionForCommonGate(gates);

  if (suppression) {
    return decision(
      event,
      "MODEL_A_WEATHER_ONLY",
      replayTime,
      available,
      gates,
      "SUPPRESSED",
      suppression,
      ["A common business gate failed."],
    );
  }

  const weatherEvidence = available.filter(
    (item) => ROOF_001.eventTypes.some((type) => type === item.signalType),
  );

  if (weatherEvidence.length === 0) {
    return decision(
      event,
      "MODEL_A_WEATHER_ONLY",
      replayTime,
      available,
      { ...gates, weatherEvidence: false },
      "WATCH",
      "INSUFFICIENT_EVIDENCE",
      ["The event has not yet produced available qualifying weather evidence."],
    );
  }

  return decision(
    event,
    "MODEL_A_WEATHER_ONLY",
    replayTime,
    weatherEvidence,
    { ...gates, weatherEvidence: true },
    "ACTIONABLE",
    undefined,
    [
      "Weather evidence is available.",
      "The business serves the event geography.",
      "The business offers a roofing service.",
    ],
  );
}
