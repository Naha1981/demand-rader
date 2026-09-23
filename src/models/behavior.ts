import type { Business } from "../domain/business.js";
import type { Evidence } from "../domain/evidence.js";
import type { MarketEvent } from "../domain/event.js";
import type { DemandDecision } from "../domain/decision.js";
import { ROOF_001 } from "../rules/roof-001.js";
import {
  commonGates,
  decision,
  evidenceForEvent,
  independentGroups,
  suppressionForCommonGate,
} from "./common.js";

export function behavior(
  event: MarketEvent,
  evidence: Evidence[],
  business: Business,
  replayTime: Date,
): DemandDecision {
  const available = evidenceForEvent(event, evidence);
  const gates = commonGates(event, business, replayTime);
  const suppression = suppressionForCommonGate(gates);

  if (suppression) {
    return decision(
      event,
      "MODEL_C_BEHAVIOR",
      replayTime,
      available,
      gates,
      "SUPPRESSED",
      suppression,
      ["A common business gate failed."],
    );
  }

  const weather = available.filter((item) =>
    ROOF_001.eventTypes.includes(item.signalType),
  );

  const consequence = available.filter((item) =>
    ROOF_001.consequenceSignalTypes.includes(item.signalType),
  );

  const behaviorEvidence = available.filter(
    (item) => item.signalType.startsWith(ROOF_001.behaviorSignalPrefix),
  );

  const evidenceUsed = [...weather, ...consequence, ...behaviorEvidence];
  const groups = independentGroups(evidenceUsed);

  const weatherAndConsequence =
    weather.length > 0 &&
    consequence.length > 0 &&
    groups.length >= ROOF_001.minimumIndependentEvidenceGroups;

  if (!weatherAndConsequence || behaviorEvidence.length === 0) {
    return decision(
      event,
      "MODEL_C_BEHAVIOR",
      replayTime,
      evidenceUsed,
      {
        ...gates,
        weatherEvidence: weather.length > 0,
        consequenceEvidence: consequence.length > 0,
        independentEvidence:
          groups.length >= ROOF_001.minimumIndependentEvidenceGroups,
        behaviorEvidence: behaviorEvidence.length > 0,
      },
      "WATCH",
      "INSUFFICIENT_EVIDENCE",
      [
        "Behavior evidence is an additional requirement in Model C.",
        "Missing behavioral evidence is UNKNOWN, not evidence of no demand.",
      ],
    );
  }

  return decision(
    event,
    "MODEL_C_BEHAVIOR",
    replayTime,
    evidenceUsed,
    {
      ...gates,
      weatherEvidence: true,
      consequenceEvidence: true,
      independentEvidence: true,
      behaviorEvidence: true,
    },
    "ACTIONABLE",
    undefined,
    [
      "Weather evidence is available.",
      "Independent consequence evidence is available.",
      "Behavioral evidence is available.",
    ],
  );
}
