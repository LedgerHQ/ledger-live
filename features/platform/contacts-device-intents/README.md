# @features/platform-contacts-device-intents

> [!CAUTION]
> **Status: UNSTABLE** — In active development; API may change as Contacts DIE wiring lands.

WXP-facing TypeScript contracts for Contacts device intents, aligned with
[ADR: Contacts Device Intents](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/7299039425/ADR+Contacts+Device+Intents).

This package exports host-friendly `IntentInput`, `Result`, and `JobState` types
only. It has **no** dependency on `@ledgerhq/device-intent`,
`@ledgerhq/device-contacts-kit`, or `@domain/entity-contact`.

DIE intent definitions, jobs, platform components, and kit byte/`bigint` mapping
are separate work blocked on architecture (see epic
[LIVE-35697](https://ledgerhq.atlassian.net/browse/LIVE-35697)).

## Layout

Follows the DIE [recommended file organization](../../../libs/device-intent/README.md#recommended-file-organization),
incomplete for now: each intent folder currently has only `types.ts`.

## Exports

Shared aliases and base job states, plus per-intent Input / Result / JobState for:

- Register external address
- Rename contact
- Edit external address identifier
- Edit external address scope
- Edit external address (convenience, includes `EditExternalAddressStep`)
- Register Ledger account
- Rename Ledger account
