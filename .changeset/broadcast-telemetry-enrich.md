---
"@ledgerhq/live-common": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

feat(broadcast): add isTestnet and isSendMax to telemetry

Adds two fields to the `broadcast_success` and `broadcast_failure` Datadog events, on both success and failure paths:
- `isTestnet`: derived from the currency model (`isTestnetFor`)
- `isSendMax`: derived from `transaction.useAllAmount`

Existing fields are left unchanged.
