# CRM contract: Content Card `extras.requiredStates`

**Audience:** CRM campaign setup  
**Architecture:** [ADR — Braze local eligibility](../adr/braze-local-eligibility.md)  
**Canonical name list:** [`APPROVED_STATES`](../../libs/ledger-live-common/src/braze/localEligibility/states.ts) — if this table and the code disagree, trust the code.

Ledger Wallet fetches the campaign for a broad audience, then shows the card only if **every** listed state is true on device.

## Format

Braze Content Card extra:

| Key | Type | Example |
| --- | --- | --- |
| `requiredStates` | string | `hasFunds;isOnboarded` |

- Separator: `;`
- Whitespace around names is ignored (`hasFunds; isOnboarded;` is valid)
- Names are **case-sensitive** (`HASFUNDS` is not `hasFunds`)
- Combine with AND: all listed states must be true
- Omit the extra (or leave it blank) to show the card to everyone who received it

## Approved values

| Value | Show the card when |
| --- | --- |
| `hasFunds` | At least one account is non-empty |
| `isOnboarded` | Onboarding is completed |
| `hasStax` | A Ledger Stax is known to the app (paired / in the device list) |

## Unknown or misspelled states

If any token is not in the approved list (typo, old name, wrong case), the card is **hidden** for everyone. Debug tooling reports `blockedBy` and `reason: "unknown-state"`.

Do not invent extra names in Braze. Request a new state from Engagement: it must land in `APPROVED_STATES` and in both apps before campaigns can use it.
