---
"@ledgerhq/types-live": minor
"@shared/feature-flags": minor
"live-mobile": patch
"ledger-live-desktop": patch
---

Remove the `concordiumVerifyAddress` feature flag and its "address verification unavailable" fallback. On-device address verification is now the unconditional path for all Concordium accounts.
