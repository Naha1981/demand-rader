import { z } from "zod";

export const DecisionSchema = z.enum([
  "ACTIONABLE",
  "WATCH",
  "SUPPRESSED",
  "UNKNOWN",
]);

export const SuppressionReasonSchema = z.enum([
  "INSUFFICIENT_EVIDENCE",
  "CONFLICTING_EVIDENCE",
  "DUPLICATE_EVENT",
  "WRONG_GEOGRAPHY",
  "NO_SERVICE_MATCH",
  "OUTSIDE_DEMAND_WINDOW",
  "NO_CAPACITY",
  "STALE_EVIDENCE",
  "ALREADY_HANDLED",
]);

export const DemandDecisionSchema = z.object({
  eventId: z.string(),
  model: z.string(),
  modelVersion: z.string(),
  replayTime: z.string().datetime(),
  decision: DecisionSchema,
  evidenceIds: z.array(z.string()),
  independenceGroups: z.array(z.string()),
  hardGates: z.record(z.string(), z.boolean()),
  suppressionReason: SuppressionReasonSchema.optional(),
  reasoningSteps: z.array(z.string()),
});

export type DemandDecision = z.infer<typeof DemandDecisionSchema>;
