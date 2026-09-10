---
"@ledgerhq/live-common": patch
---

Guard against a bridge extension returning an undefined spendable balance, which crashed the wallet-api serializer when selecting an Aleo token with no synced sub-account
