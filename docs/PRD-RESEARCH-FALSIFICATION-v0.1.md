# Demand Radar — Research & Falsification PRD v0.1

**Status:** Frozen for implementation  
**Scope:** Research harness only

## 1. Objective

Determine whether observable real-world events can be converted into sufficiently early, geographically precise, and commercially useful demand signals for service businesses.

The experiment must be capable of falsifying the thesis.

## 2. Hypotheses

### H1

Combining external events, independently corroborating consequences, behavioral evidence, and business-specific context can identify actionable commercial opportunities earlier and/or more precisely than simpler event-based detection.

### H0

Additional intelligence layers do not provide enough improvement over simple event detection to justify Demand Radar.

## 3. Prediction ladder

The system must keep these claims separate:

EVENT  
→ PROBLEM CREATED  
→ DEMAND INDICATED  
→ PURCHASE INTENT INDICATED  
→ BUSINESS OPPORTUNITY  
→ ACTIONABLE

A verified event does not prove commercial demand.

## 4. Experimental unit

A **Demand Window**:

- event
- geography
- time window
- evidence available at replay time
- candidate service
- business context

## 5. First event

**GE-001 — 13 November 2023 Gauteng severe-weather/hail event**

The evidence fixture must preserve observedAt, publishedAt, availableAt, source, sourceUrl, publisher, geography, signalType, independenceGroup, contentHash, and epistemicType.

## 6. Gold-label separation

The golden event stores independent labels:

- eventVerified
- consequenceVerified
- demandIndicated
- purchaseIntentIndicated
- commercialOutcomeVerified

Each label may be YES, NO, or UNKNOWN.

## 7. Models

### Model A — Weather Only

Event + geography + roofing service + open demand window.

### Model B — Weather + Consequence

Model A + independently corroborated local property/infrastructure consequence.

### Model C — Weather + Consequence + Behavior

Model B + behavioral evidence.

Absence of behavior evidence must not be treated as evidence of no demand.

### Model D — Business Fit

Model C + service match + geography + demand window + provider capacity + minimum job economics.

Model D is called **Business Fit**, not Business Demand.

## 8. Decision states

- ACTIONABLE
- WATCH
- SUPPRESSED
- UNKNOWN

## 9. Hard gates

- service match
- geography match
- demand window open
- required evidence satisfied
- duplicate check
- provider active
- capacity where applicable

## 10. Evidence epistemic types

- OBSERVED
- REPORTED
- DERIVED
- INFERRED
- HYPOTHESIZED

Observed and reported evidence can directly support action. Derived evidence must be deterministic and auditable. Inferred/hypothesized content cannot independently establish an actionable factual claim.

## 11. Independence

Count independent evidence groups, not article count. Multiple reports reproducing one underlying source may share an independenceGroup.

## 12. Replay rule

At replay time T:

`availableAt <= T`

Future evidence must be invisible to the model.

## 13. Required decision trace

Every model decision records:

- eventId
- model
- modelVersion
- replayTime
- decision
- evidenceIds
- independenceGroups
- hardGates
- suppressionReason, when applicable

## 14. Metrics

Initial metrics:

- detection lead time
- precision
- false-positive rate
- opportunity density
- geographic accuracy
- evidence sufficiency accuracy
- suppression accuracy

The eventual commercial north star is **Incremental Revenue per Actionable Demand Signal**, but the v0.1 harness does not pretend to measure it without real business outcomes.

## 15. Adversarial cases

The harness must test:

- severe weather without local property impact
- property impact with wrong service
- wrong geography
- national search spike without local event
- duplicate/copying news coverage
- seasonal search spike
- source outage
- zero provider capacity
- detection after useful demand already exists
- no incremental value versus ordinary acquisition

## 16. Kill criteria

Reconsider or kill the thesis if repeated historical replay shows:

1. signals generally arrive after commercially useful demand;
2. added evidence does not materially improve precision;
3. false positives create unacceptable provider noise;
4. actionable opportunities are too infrequent;
5. business fit adds little value;
6. Demand Radar cannot demonstrate incremental value versus ordinary acquisition;
7. providers cannot act quickly enough.

## 17. Explicit non-goals

No production dashboard, authentication, billing, autonomous activation, WhatsApp, CRM, AI agent, graph database, production search API, or multi-tenancy in v0.1.

## 18. Acceptance criteria

- repository installs cleanly
- TypeScript compiles
- GE-001 fixture loads
- replay clock works
- no-look-ahead works
- Models A–D run
- decision traces are generated
- metrics are generated
- deterministic replay passes
- idempotent replay passes
- adversarial tests pass
- every actionable decision has provenance
- report is reproducible from fixture + code/model/rule versions
