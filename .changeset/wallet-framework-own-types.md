---
"@ledgerhq/ledger-wallet-framework": minor
---

Define framework-owned `CryptoCurrency`, `TokenCurrency`, and `Unit` structural interfaces in `src/types.ts` and remove the `@ledgerhq/types-cryptoassets` production dependency. The interfaces are structurally compatible with the legacy types, so no call-site changes are needed.
