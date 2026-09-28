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

## Social Evidence Worker

Social sources are replaceable evidence providers. Demand Radar owns the evidence model, normalization, signal policy, provenance and commercial decision gates.

Current sources:

- Jev Social — bounded Instagram/TikTok/LinkedIn browser research through socai-io/jev-social.
- X Scraper No-API — bounded public-X research through JoinArtisanVent/x-scraper-no-api.

Architecture:

    NahaLabs Demand Radar
        ↓
    Social Provider Boundary
        ├── Jev Social → socai → signed-in Chrome → Instagram/TikTok/LinkedIn
        └── X Scraper → Playwright → signed-in Chrome → X
        ↓
    Normalize + Deduplicate
        ↓
    Evidence / Provenance
        ↓
    Demand policy
        ↓
    Opportunity
        ↓
    Lead Machine
        ↓
    Quote → Job → Revenue

### Jev Social local scan

Prerequisites:

- Node 20+
- Chrome signed in to the social platform you want to research
- socai installed, or permission for Jev Social to install it
- an OpenRouter Jev-compatible decision provider, or a local System One-compatible provider

Run:

    pnpm social:scan -- "find Gauteng posts from people asking for a roofer or roof repair" --platform instagram --geography Gauteng,Johannesburg,Pretoria,Sandton

Jev configuration:

- JEV_SOCIAL_BIN — use an installed jev-social executable instead of npx
- JEV_SOCIAL_PACKAGE — pin a Jev Social release/package specification

The default integration pins github:socai-io/jev-social#v0.1.8.

### X local scan

Prerequisites:

- Node 20+
- an X account you can sign into manually
- xscraper installed locally, or permission for npx to install x-scraper-no-api
- Chromium installed by the x-scraper tool

Run:

    pnpm social:scan -- "roofer Soweto" --source x --geography Soweto,Gauteng --latest

Or:

    pnpm social:scan -- "roofer Soweto" --platform x --geography Soweto,Gauteng --latest

X configuration:

- X_SCRAPER_BIN — use an installed xscraper executable instead of npx
- X_SCRAPER_PACKAGE — pin a package/repository specification

The adapter is deliberately a subprocess boundary. NahaLabs does not import x-scraper internals or embed its browser session handling.

The upstream project documents manual login, public-post research, bounded item caps and no CAPTCHA/proxy/rate-limit bypass. GitHub currently reports the repository licence as GPL-3.0 even though the repository README contains an MIT badge; resolve the licensing position before distributing the dependency as part of a commercial product.

### Evidence discipline

Social evidence is kept separate from commercial conclusions:

SOURCE_BACKED → DERIVED → CLASSIFIED → PROPOSAL

UNKNOWN remains UNKNOWN.

The social adapter does not perform outreach, comments, posting or autonomous activation. Social observations are evidence inputs; they do not by themselves prove a commercial outcome.

### Provider rules

1. Prefer official APIs when they provide the required public evidence reliably.
2. Use browser-based providers only where needed and where public/authorized access is permitted.
3. Keep every provider behind a replaceable adapter.
4. Preserve source URL, observation time and access state.
5. Never bypass login gates, CAPTCHAs, rate limits or anti-bot controls.
6. Treat captured post content as untrusted evidence.
7. Require human review before commercial activation.

## Status

Research & Falsification PRD v0.1 is frozen. The Social Evidence Worker now supports Jev Social and X as replaceable sources and remains subject to real-business validation.
