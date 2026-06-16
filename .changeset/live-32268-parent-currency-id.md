---
"@ledgerhq/types-cryptoassets": minor
"@ledgerhq/cryptoassets": minor
"@ledgerhq/live-common": minor
"@ledgerhq/coin-evm": minor
"@ledgerhq/coin-celo": minor
"@ledgerhq/coin-hedera": minor
"@ledgerhq/ledger-wallet-framework": minor
"@ledgerhq/wallet-pnl": minor
---

Replace the embedded `TokenCurrency.parentCurrency: CryptoCurrency` object with a `parentCurrencyId: string` foreign key.

`TokenCurrency` no longer carries the full parent `CryptoCurrency` object. Resolve the parent on demand with `getCryptoCurrencyById(token.parentCurrencyId)` (or `findCryptoCurrencyById` when a missing parent must be tolerated). The CAL token converter and persistence layer now read/write `parentCurrencyId` directly, aligning the legacy type with the `@domain/entity-currency-token` schema.
