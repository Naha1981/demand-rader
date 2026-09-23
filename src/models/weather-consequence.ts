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

export function weatherConsequence(
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
      "MODEL_B_WEATHER_CONSEQUENCE",
      replayTime,
      available,
      gates,
      "SUPPRESSED",
      suppression,
      ["A common business gate failed."],
    );
  }

  const weatherEvidence = available.filter((item) =>
    ROOF_001.eventTypes.includes(item.signalType),
  );

  const consequenceEvidence = available.filter((item) =>
    ROOF_001.consequenceSignalTypes.includes(item.signalType),
  );

  const evidenceUsed = [...weatherEvidence, ...consequenceEvidence];
  const groups = independentGroups(evidenceUsed);
  const consequenceHasIndependentGroup = groups.length >= 2;

  if (!consequenceHasIndependentGroup) {
    return decision(
      event,
      "MODEL_B_WEATHER_CONSEQUENCE",
      replayTime,
      evidenceUsed,
      {
        ...gates,
        weatherEvidence: weatherEvidence.length > 0,
        consequenceEvidence: consequenceEvidence.length > 0,
        independentEvidence: false,
      },
      "WATCH",
      "INSUFFICIENT_EVIDENCE",
      [
        "Weather evidence is present or available.",
        "An independently corroborated local consequence is not yet established.",
        "Article count is not treated as independence.",
      ],
    );
  }

  return decision(
    event,
    "MODEL_B_WEATHER_CONSEQUENCE",
    replayTime,
    evidenceUsed,
    {
      ...gates,
      weatherEvidence: weatherEvidence.length > 0,
      consequenceEvidence: consequenceEvidence.length > 0,
      independentEvidence: true,
    },
    "ACTIONABLE",
    undefined,
    [
      "Qualifying weather evidence is available.",
      "Qualifying consequence evidence is available.",
      "At least two independent evidence groups are represented.",
    ],
  );
}
