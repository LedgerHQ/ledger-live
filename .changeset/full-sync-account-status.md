---
"@ledgerhq/live-common": minor
---

The full-sync source answers the `accountStatus` and `assetStatus` kinds, with the family rules: onboarding for Canton and Concordium, asset activation for Hedera, Algorand, Stellar and XRP, for VeChain an empty VTHO does not count as used, and a Kaspa account is used once it has an operation
