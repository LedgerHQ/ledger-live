---
"@ledgerhq/coin-aleo": patch
"@ledgerhq/coin-algorand": patch
"@ledgerhq/coin-aptos": patch
"@ledgerhq/coin-bitcoin": patch
"@ledgerhq/coin-canton": patch
"@ledgerhq/coin-cardano": patch
"@ledgerhq/coin-casper": patch
"@ledgerhq/coin-celo": major
"@ledgerhq/coin-concordium": patch
"@ledgerhq/coin-cosmos": major
"@ledgerhq/coin-filecoin": patch
"@ledgerhq/coin-hedera": patch
"@ledgerhq/coin-icon": patch
"@ledgerhq/coin-internet_computer": patch
"@ledgerhq/coin-kaspa": patch
"@ledgerhq/coin-mina": patch
"@ledgerhq/coin-multiversx": patch
"@ledgerhq/coin-near": patch
"@ledgerhq/coin-polkadot": patch
"@ledgerhq/coin-solana": patch
"@ledgerhq/coin-stacks": patch
"@ledgerhq/coin-sui": patch
"@ledgerhq/coin-ton": patch
"@ledgerhq/coin-tron": patch
"@ledgerhq/coin-vechain": patch
"@ledgerhq/coin-zcash": patch
"@ledgerhq/live-common": patch
---

Export the default coin configs from each coin package and wrap them in `ledger-live-common` (ADR-063). `coin-celo` and `coin-cosmos` replace their `celoConfig` and `cosmosConfig` exports, which wrapped the defaults in `ConfigInfo`, with plain typed `celoDefaults` and `cosmosDefaults`; their `features` now use the `status` key instead of `type`, Desmos gets the active status it was missing, and Gonka defaults to a minimum gas price of 1 ngonka
