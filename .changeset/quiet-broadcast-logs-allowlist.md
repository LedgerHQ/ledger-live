---
"@ledgerhq/live-common": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Stop sending the signed transaction to Datadog when a broadcast fails: the `broadcast_failure` log keeps only allowlisted attributes, a sanitized error message and stack, and flat sanitized error properties
