---
"@domain/entity-currency": minor
"@domain/entity-account-balance": minor
"@domain/entity-account-balance-history": minor
"@domain/entity-account-operation": minor
"@domain/entity-contact": minor
"@domain/api-market-countervalues": minor
"@devtools/bindings": minor
"@ledgerhq/live-common": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Add `CryptoOrTokenCurrencyIdSchema` and `CryptoOrTokenCurrencyId` to `@domain/entity-currency`, replacing the duplicated `BalanceAssetIdSchema`, `ContactCurrencyIdSchema` and the send flow's local union. Runtime parsing is unchanged.
