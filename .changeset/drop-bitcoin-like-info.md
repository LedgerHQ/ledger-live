---
"@ledgerhq/types-live": minor
"@ledgerhq/ledger-wallet-framework": minor
"@domain/entity-currency-crypto": minor
"@ledgerhq/coin-bitcoin": patch
"@ledgerhq/coin-zcash": patch
---

chore(currency): drop `CryptoCurrency#bitcoinLikeInfo`

coin-bitcoin now reads the xpub version from its own `getNetworkParameters`, and coin-zcash from a local `ZCASH_XPUB_VERSION` constant. The unused `bitcoinLikeInfo` field (and `BitcoinLikeInfoSchema`) is removed from the currency types and registry.
