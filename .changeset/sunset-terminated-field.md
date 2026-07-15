---
"@ledgerhq/cryptoassets": minor
"@ledgerhq/types-cryptoassets": minor
"@ledgerhq/live-common": minor
"@ledgerhq/coin-bitcoin": minor
"@ledgerhq/ledger-wallet-framework": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Sunset the `CryptoCurrency.terminated` field: remove it from the type/schema, delete the 5 currencies it marked (clubcoin, hcash, poswallet, stakenet, stratis), drop the now-unused `withTerminated` parameter from `listCryptoCurrencies`, and clean up the dead code orphaned by those deletions.
