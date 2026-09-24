import type { DemandDecision } from "../domain/decision.js";

export function firstActionableAt(
  decisions: DemandDecision[],
): string | null {
  const actionable = decisions
    .filter((decision) => decision.decision === "ACTIONABLE")
    .sort(
      (a, b) =>
        new Date(a.replayTime).getTime() -
        new Date(b.replayTime).getTime(),
    );

  return actionable[0]?.replayTime ?? null;
}

export function summarizeModel(
  decisions: DemandDecision[],
) {
  return {
    actionableDecisionCount: decisions.filter(
      (decision) => decision.decision === "ACTIONABLE",
    ).length,
    watchDecisionCount: decisions.filter(
      (decision) => decision.decision === "WATCH",
    ).length,
    suppressedDecisionCount: decisions.filter(
      (decision) => decision.decision === "SUPPRESSED",
    ).length,
    unknownDecisionCount: decisions.filter(
      (decision) => decision.decision === "UNKNOWN",
    ).length,
    firstActionableAt: firstActionableAt(decisions),
    precision: null,
    falsePositiveRate: null,
    note:
      "Commercial precision cannot be measured until verified demand or business outcome labels are available.",
  };
}
