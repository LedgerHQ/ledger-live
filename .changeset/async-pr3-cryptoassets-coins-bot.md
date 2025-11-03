---
"@ledgerhq/types-live": minor
"@ledgerhq/cryptoassets": minor
"@ledgerhq/coin-framework": minor
"@ledgerhq/coin-algorand": minor
"@ledgerhq/coin-multiversx": minor
"@ledgerhq/coin-solana": minor
"@ledgerhq/coin-evm": minor
"@ledgerhq/ledger-live-common": minor
"@ledgerhq/live-cli": minor
"@ledgerhq/live-wallet": minor
"@ledgerhq/live-countervalues": minor
---

BREAKING: CryptoAssetsStore interface is now fully async. All token lookup methods return Promises. Bot system and coin modules updated to support async token operations.

