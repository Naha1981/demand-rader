import type { Business } from "../domain/business.js";
import type { Evidence } from "../domain/evidence.js";
import type { MarketEvent } from "../domain/event.js";
import type { DemandDecision } from "../domain/decision.js";
import { geographyMatches } from "../replay/geography.js";
import { demandWindowOpen } from "../replay/window.js";

export const MODEL_VERSION = "0.1.0";

export type DecisionModel = (
  event: MarketEvent,
  evidence: Evidence[],
  business: Business,
  replayTime: Date,
) => DemandDecision;

export function commonGates(
  event: MarketEvent,
  business: Business,
  replayTime: Date,
) {
  const serviceMatch = business.services.some((service) =>
    ["roof repair", "roof inspection", "storm damage repair"].includes(
      service.toLowerCase(),
    ),
  );

  const geographyMatch = geographyMatches(
    event.geographies,
    business.serviceArea,
  );

  const demandWindow = demandWindowOpen(event, replayTime);

  return {
    providerActive: business.active,
    serviceMatch,
    geographyMatch,
    demandWindowOpen: demandWindow,
  };
}

export function suppressionForCommonGate(
  gates: ReturnType<typeof commonGates>,
): DemandDecision["suppressionReason"] | null {
  if (!gates.providerActive) return "ALREADY_HANDLED";
  if (!gates.serviceMatch) return "NO_SERVICE_MATCH";
  if (!gates.geographyMatch) return "WRONG_GEOGRAPHY";
  if (!gates.demandWindowOpen) return "OUTSIDE_DEMAND_WINDOW";
  return null;
}

export function evidenceForEvent(
  event: MarketEvent,
  availableEvidence: Evidence[],
): Evidence[] {
  const ids = new Set(event.evidenceIds);
  return availableEvidence.filter((item) => ids.has(item.id));
}

export function independentGroups(evidence: Evidence[]): string[] {
  return [...new Set(evidence.map((item) => item.independenceGroup))].sort();
}

export function decision(
  event: MarketEvent,
  model: string,
  replayTime: Date,
  availableEvidence: Evidence[],
  gates: Record<string, boolean>,
  value: DemandDecision["decision"],
  suppressionReason: DemandDecision["suppressionReason"] | undefined,
  reasoningSteps: string[],
): DemandDecision {
  const groups = independentGroups(availableEvidence);

  return {
    eventId: event.id,
    model,
    modelVersion: MODEL_VERSION,
    replayTime: replayTime.toISOString(),
    decision: value,
    evidenceIds: availableEvidence.map((item) => item.id),
    independenceGroups: groups,
    hardGates: gates,
    ...(suppressionReason ? { suppressionReason } : {}),
    reasoningSteps,
  };
}
