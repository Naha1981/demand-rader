# Demand Radar

Demand Intelligence & Activation — Research & Falsification Harness.

## Purpose

This repository initially exists to test whether real-world events, corroborating consequences, behavioral evidence, and business-specific context can identify commercially useful service demand early enough and precisely enough to justify a production Demand Radar system.

> Don't search for people who need the service. Search for events that make people likely to need the service.

## Phase 0.1

The first implementation is a deterministic historical replay harness.

It deliberately excludes production SaaS concerns:

- no dashboard
- no authentication
- no billing
- no autonomous activation
- no AI agents
- no graph database
- no production search integrations
- no multi-tenancy

The first golden event is GE-001: the 13 November 2023 Gauteng severe-weather/hail event.

## Principles

1. No look-ahead: replay may use only evidence available at replay time.
2. Missing evidence is UNKNOWN, not FALSE.
3. Duplicate reporting is not independent corroboration.
4. AI cannot create evidence.
5. Every actionable decision must be reproducible from its evidence IDs and model/rule version.
6. The experiment is allowed to falsify the Demand Radar thesis.

## Models

- Model A — Weather Only
- Model B — Weather + Consequence
- Model C — Weather + Consequence + Behavior
- Model D — Business Fit

The goal is to measure whether each added intelligence layer actually contributes useful information.

## Status

Research & Falsification PRD v0.1 is frozen. Implementation is underway.
