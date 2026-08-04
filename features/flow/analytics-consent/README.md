# @features/flow-analytics-consent

> [!CAUTION]
> **Status: UNSTABLE** — In active development as part of the analytics consent renewal feature.

Decides whether Ledger Wallet must ask for analytics consent again, only ask the user to
acknowledge a new privacy policy, or stay silent. Implements
[ADR: Analytics Consent Renewal](https://ledgerhq.atlassian.net/wiki/spaces/Engagement/pages/7249592355):
`analyticsOptIn.params.policyVersion` carries major/minor semantics.

Renewal is version-driven only. A stored consent never expires on a timer, so
`analyticsOptIn.params.consentValidityDays` is not read here — it remains for desktop, which
still runs its own rolling window through `libs/ledger-live-common`.

One verdict drives both the consent drawer and the tracking gate, so optional analytics is
disabled exactly while a fresh choice is pending.

## Exports

- `getAnalyticsConsentDecision` — `{ kind: "renewal" | "privacy" | "none", reason }`
  - `renewal` — consent date missing/invalid, stored version missing/invalid, or a major bump
  - `privacy` — same major, newer minor, consent otherwise valid
  - `none` — up to date, stored version newer than current (remote-config rollback), or current version invalid
- `useAnalyticsConsentDecision` — reads the `analyticsOptIn` flag and returns the verdict plus the version to persist
- `resolveAnalyticsOptInParams` — strict flag params; an invalid `policyVersion` resolves to `null` (version checks off) and warns once instead of defaulting
- `resolveAnalyticsConsentPhase` — maps a verdict to the drawer/dialog phase
- `getConsentDateState` — `"missing" | "invalid" | "valid"`, for QA diagnostics

Renewal outranks privacy acknowledgement. An invalid current version disables version checks
but never the check that a consent was recorded at all.

## Testing

```sh
pnpm test
pnpm typecheck
```
