---
"@ledgerhq/types-live": minor
"@ledgerhq/cryptoassets": minor
"@ledgerhq/live-common": minor
"@ledgerhq/live-countervalues": minor
"@ledgerhq/coin-solana": minor
"@ledgerhq/coin-tester-evm": minor
"@ledgerhq/coin-tester-solana": minor
"@ledgerhq/live-cli": minor
---

Remove deprecated `findTokenByTicker` function and related internal state. This function was ambiguous when multiple tokens shared the same ticker across different blockchains. Use `findTokenById` or `findTokenByAddressInCurrency` instead for more precise token lookup.

