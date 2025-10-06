---
"@ledgerhq/types-live": patch
"@ledgerhq/cryptoassets": patch
"@ledgerhq/live-common": patch
"@ledgerhq/live-countervalues": patch
"@ledgerhq/coin-solana": patch
"@ledgerhq/coin-tester-evm": patch
"@ledgerhq/coin-tester-solana": patch
"@ledgerhq/live-cli": patch
---

Remove deprecated `findTokenByTicker` function and related internal state. This function was ambiguous when multiple tokens shared the same ticker across different blockchains. Use `findTokenById` or `findTokenByAddressInCurrency` instead for more precise token lookup.

