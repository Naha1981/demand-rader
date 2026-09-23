import type { Business } from "../domain/business.js";
import type { Evidence } from "../domain/evidence.js";
import type { MarketEvent } from "../domain/event.js";
import type { DemandDecision } from "../domain/decision.js";
import { behavior } from "./behavior.js";

export function businessFit(
  event: MarketEvent,
  evidence: Evidence[],
  business: Business,
  replayTime: Date,
): DemandDecision {
  const base = behavior(event, evidence, business, replayTime);

  if (base.decision !== "ACTIONABLE") {
    return {
      ...base,
      model: "MODEL_D_BUSINESS_FIT",
      reasoningSteps: [
        ...base.reasoningSteps,
        "Model D cannot become actionable until Model C is actionable.",
      ],
    };
  }

  if (business.capacity <= 0) {
    return {
      ...base,
      model: "MODEL_D_BUSINESS_FIT",
      decision: "SUPPRESSED",
      suppressionReason: "NO_CAPACITY",
      hardGates: {
        ...base.hardGates,
        capacityAvailable: false,
      },
      reasoningSteps: [
        ...base.reasoningSteps,
        "Provider capacity is zero.",
      ],
    };
  }

  if (business.minimumJobValue <= 0) {
    return {
      ...base,
      model: "MODEL_D_BUSINESS_FIT",
      decision: "WATCH",
      suppressionReason: "INSUFFICIENT_EVIDENCE",
      hardGates: {
        ...base.hardGates,
        capacityAvailable: true,
        minimumJobEconomicsConfigured: false,
      },
      reasoningSteps: [
        ...base.reasoningSteps,
        "Minimum job economics are not configured.",
      ],
    };
  }

  return {
    ...base,
    model: "MODEL_D_BUSINESS_FIT",
    hardGates: {
      ...base.hardGates,
      capacityAvailable: true,
      minimumJobEconomicsConfigured: true,
    },
    reasoningSteps: [
      ...base.reasoningSteps,
      "Provider capacity is available.",
      "Minimum job economics are configured.",
    ],
  };
}
