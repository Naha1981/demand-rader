# GE-001 Initial Replay Result

**Experiment:** Demand Radar Research & Falsification v0.1  
**Event:** GE-001 — 13 November 2023 Gauteng severe-weather/hail event  
**Business fixture:** BUS-ROOFING-JHB-01  
**Status:** Inconclusive by design

## Automated verification

GitHub Actions completed successfully for the replay build:

- TypeScript check: PASS
- Unit tests: PASS
- GE-001 replay: PASS

## Observed model behavior

| Model | First actionable checkpoint | Result |
|---|---|---|
| A — Weather Only | 2023-11-13 17:36Z | ACTIONABLE at all 4 checkpoints |
| B — Weather + Consequence | 2023-11-13 20:29Z | WATCH initially, then ACTIONABLE |
| C — Weather + Consequence + Behavior | none | WATCH at all checkpoints |
| D — Business Fit | none | WATCH at all checkpoints |

## Important observation

Model A becomes actionable as soon as the first qualifying weather report is available.

Model B remains in WATCH until an independently sourced local roofing/property consequence is available. In GE-001, that occurs at the 20:29Z TimesLIVE checkpoint, 2h53 after the 17:36Z SABC report.

This demonstrates that the evidence-independence rule changes the decision timing.

It does **not** demonstrate that the later Model B decision was commercially correct.

## What this experiment proves

- Historical replay is deterministic.
- Future evidence cannot enter an earlier replay.
- Evidence independence can materially change model state.
- Missing behavioral evidence is treated as UNKNOWN/WATCH, not FALSE.
- Business-specific logic can remain conservative when upstream evidence is incomplete.
- Every actionable decision contains evidence IDs and a decision trace.

## What it does not prove

This single event does not prove:

- roofing purchase intent
- customer search intent
- incremental leads
- incremental revenue
- optimal activation timing
- superiority over ordinary lead generation

The gold fixture therefore keeps demand indication, purchase intent, and commercial outcome as UNKNOWN.

## Research conclusion

**THESIS STATUS: INCONCLUSIVE**

GE-001 is a successful structural test, not a commercial validation.

The next falsification step is to replay a larger heterogeneous event set and then compare the resulting opportunity windows against real business outcomes.

## Source provenance

The fixture uses contemporary SABC News and TimesLIVE reports for replay evidence and a later South African Weather Service report as retrospective event verification. The later SAWS report is explicitly excluded from the 2023 replay clock.

- SABC News: https://www.sabcnews.com/sabcnews/893624-2-2/
- SABC News: https://www.sabcnews.com/sabcnews/storm-wreaks-havoc-in-joburg/
- SABC News: https://www.sabcnews.com/sabcnews/joburg-ems-remains-on-high-alert-amid-hailstorms/
- SABC News: https://www.sabcnews.com/sabcnews/hailstorm/
- TimesLIVE: https://www.timeslive.co.za/news/south-africa/2023-11-13-hailstorms-and-apparent-tornado-in-gauteng-and-mpumalanga/
- TimesLIVE: https://www.timeslive.co.za/news/south-africa/2023-11-14-busy-night-for-emergency-services-as-hailstorm-wreaks-havoc/
- TimesLIVE: https://www.timeslive.co.za/news/south-africa/2023-11-14-roof-of-rosebank-hotel-collapses-after-joburg-hailstorm-guests-evacuated/
- SAWS retrospective report: https://www.weathersa.co.za/Documents/AnnualReports/SAWS_AR2024_FINAL_WEB_VERSION_161024_27032025105202.pdf
