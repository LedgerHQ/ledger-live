---
"@ledgerhq/cryptoassets": minor
"@ledgerhq/live-common": minor
"@ledgerhq/live-cli": minor
"@ledgerhq/coin-evm": minor
"@ledgerhq/coin-tester-evm": minor
"@ledgerhq/coin-tester-solana": minor
"@ledgerhq/types-live": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Remove deprecated findTokenByAddress in favor of findTokenByAddressInCurrency

Removed the deprecated `findTokenByAddress` function which had ambiguous behavior when multiple tokens shared the same contract address across different blockchains. The function has been fully replaced with `findTokenByAddressInCurrency` which requires both the token address and parent currency ID, providing more precise token lookup.

This includes:
- Removal of `findTokenByAddress` function from cryptoassets package
- Removal of `tokensByAddress` state dictionary
- Update all usages to `findTokenByAddressInCurrency` across the codebase
- Update CryptoAssetsStore interface to remove the deprecated method

