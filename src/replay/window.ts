import type { MarketEvent } from "../domain/event.js";

export function demandWindowOpen(
  event: MarketEvent,
  replayTime: Date,
): boolean {
  const start =
    event.startedAt ??
    event.replayCheckpoints[0];

  if (!start) return false;

  const startMs = new Date(start).getTime();
  const endMs = startMs + event.demandWindowHours * 60 * 60 * 1000;
  const now = replayTime.getTime();

  return now >= startMs && now <= endMs;
}
