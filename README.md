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

## Social Demand Radar

The first commercial extension is a bounded social-evidence adapter for Instagram, TikTok and LinkedIn.

Architecture:

NahaLabs Demand Radar → Social Evidence Adapter → Jev Social → socai → signed-in Chrome → social platform

Jev Social is treated as replaceable execution infrastructure. Demand Radar owns the evidence model, signal policy, provenance and commercial decision gates.

### Local scan

Prerequisites:

- Node 20+
- Chrome signed in to the social platform you want to research
- socai installed, or permission for Jev Social to install it
- an OpenRouter Jev-compatible decision provider, or a local System One-compatible provider

Run:

    pnpm social:scan -- "find Gauteng posts from people asking for a roofer or roof repair" --platform instagram --geography Gauteng,Johannesburg,Pretoria,Sandton

The command returns:

- captured source-linked evidence
- execution/access state
- normalized provenance
- roofing signal classification
- human-review candidates

A damage report is not automatically treated as demand. An explicit service request can become a candidate only when the configured geography evidence is also present.

### Configuration

Optional environment variables:

- JEV_SOCIAL_BIN — use an installed jev-social executable instead of npx
- JEV_SOCIAL_PACKAGE — pin a Jev Social release/package specification

The default integration pins github:socai-io/jev-social#v0.1.8 through npx.

### Evidence discipline

Social evidence is kept separate from commercial conclusions:

SOURCE_BACKED → DERIVED → CLASSIFIED → PROPOSAL

UNKNOWN remains UNKNOWN.

The social adapter does not perform outreach, comments, posting or autonomous activation.

## Status

Research & Falsification PRD v0.1 is frozen. Social Demand Radar adapter is implemented as the first evidence-collection integration and remains subject to real-business validation.
