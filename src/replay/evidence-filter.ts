import type { Evidence } from "../domain/evidence.js";

export function evidenceAvailableAt(
  evidence: Evidence[],
  replayTime: Date,
): Evidence[] {
  return evidence.filter(
    (item) => new Date(item.availableAt).getTime() <= replayTime.getTime(),
  );
}
