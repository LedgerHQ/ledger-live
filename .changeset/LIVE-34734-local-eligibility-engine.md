---
"@ledgerhq/live-common": minor
---

Add a shared local eligibility engine for Braze Content Cards (`braze/localEligibility`). It parses the `extras.requiredStates` campaign contract (semicolon-separated) and evaluates a card against a boolean snapshot of the current app state, returning `{ eligible: true }` or `{ eligible: false, blockedBy, reason }`. The evaluator is pure and platform-agnostic; unknown/misspelled states fail safely (card hidden) with a debug signal. Platform integrations (mobile/desktop) consume it after fetch, before Redux dispatch.
