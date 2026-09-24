# ADR: Braze local eligibility for Content Cards

**Status:** Accepted  
**Ticket:** [LIVE-34737](https://ledgerhq.atlassian.net/browse/LIVE-34737) (epic [LIVE-34728](https://ledgerhq.atlassian.net/browse/LIVE-34728))  
**CRM extras contract:** [requiredStates campaign contract](../braze/required-states-campaign-contract.md)

## Context

CRM must deliver Content Cards to users who opted out of analytics. Those users must stay **unidentified** in Braze (no `external_id`). Segment→Braze cohort sync is also laggy and environment-dependent.

Braze cannot be the source of truth for “does this user currently have funds / a Stax / completed onboarding?”. Eligibility has to be decided on device from live app state.

## Decision

CRM sends **broad** campaigns. Ledger Wallet fetches cards via the Braze SDK, then **filters locally** before Redux/UI:

```
CRM (extras.requiredStates) → Braze SDK fetch → evaluateLocalEligibility → Redux → UI
```

- Shared engine: [`libs/ledger-live-common/src/braze/localEligibility/`](../../libs/ledger-live-common/src/braze/localEligibility/index.ts)
- Canonical allowlist: [`states.ts`](../../libs/ledger-live-common/src/braze/localEligibility/states.ts) (`APPROVED_STATES`)
- Platform snapshot: `useBrazeEligibilityContext` on [desktop](../../apps/ledger-live-desktop/src/mvvm/features/DynamicContent/hooks/useBrazeEligibilityContext.ts) and [mobile](../../apps/ledger-live-mobile/src/mvvm/features/DynamicContent/hooks/useBrazeEligibilityContext.ts)
- Applied after fetch, before dispatch: `filterEligibleContentCards`

Unknown or misspelled states **hide** the card (`reason: "unknown-state"`). That is fail-safe: a typo must not render to the wrong users.

## Alternatives considered

| Option | Why not |
| --- | --- |
| Braze / Segment cohorts as eligibility | Laggy; opted-out users have no reliable cohort |
| Filter only in UI after Redux | Ineligible cards would sit in store and retrigger surfaces |
| Open-ended extra strings with no allowlist | Typos would silently match nobody or, worse, be ignored and shown to everyone |

## Adding a new `requiredStates` value

A Braze extra alone is not enough. Ship a PR that:

1. Adds the exact key to `APPROVED_STATES` in `states.ts`
2. Wires a boolean into **both** `useBrazeEligibilityContext` hooks
3. Updates the [CRM contract](../braze/required-states-campaign-contract.md)

Until that lands, the new name is treated as unknown and the card stays hidden.
