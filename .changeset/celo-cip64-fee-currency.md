---
"@ledgerhq/coin-celo": minor
"@ledgerhq/cryptoassets": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Display the correct fee currency for Celo CIP-64 transactions (fees paid in tokens such as USDT/USDC instead of native CELO). Adds a `feeCurrencyAddress` field to `CeloOperationExtra`, an `eth_getTransactionByHash`-based sync enrichment, and a `skip` option to `useTokenByAddressInCurrency` for conditional CAL lookups.
