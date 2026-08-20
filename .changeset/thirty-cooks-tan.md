---
"@ledgerhq/coin-casper": minor
"@ledgerhq/live-common": minor
---

Add a `CoinFrameworkSigner` for Casper so the family can derive addresses and sign through the generic coin adapter. Address derivation, signature tagging and device access are now shared with the legacy bridge instead of duplicated, so the two paths cannot drift; legacy behaviour is unchanged and the adapter flag stays off.
