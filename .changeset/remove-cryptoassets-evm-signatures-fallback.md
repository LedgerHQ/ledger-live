---
"@ledgerhq/hw-app-eth": minor
"@ledgerhq/evm-tools": minor
---

Remove static ERC20 and EIP712 signature fallbacks to reduce bundle size. The system now exclusively uses dynamic API calls for token signatures and message filters, with the entire `@ledgerhq/cryptoassets-evm-signatures` package removed.

