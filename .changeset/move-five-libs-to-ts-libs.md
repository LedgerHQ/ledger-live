---
"@ledgerhq/coin-aleo": patch
"@ledgerhq/coin-algorand": patch
"@ledgerhq/coin-aptos": patch
"@ledgerhq/coin-bitcoin": patch
"@ledgerhq/coin-canton": patch
"@ledgerhq/coin-cardano": patch
"@ledgerhq/coin-celo": patch
"@ledgerhq/coin-concordium": patch
"@ledgerhq/coin-cosmos": patch
"@ledgerhq/coin-filecoin": patch
"@ledgerhq/coin-hedera": patch
"@ledgerhq/coin-icon": patch
"@ledgerhq/coin-kaspa": patch
"@ledgerhq/coin-multiversx": patch
"@ledgerhq/coin-solana": patch
"@ledgerhq/coin-stacks": patch
"@ledgerhq/coin-sui": patch
"@ledgerhq/coin-ton": patch
"@ledgerhq/coin-zcash": patch
"@ledgerhq/hw-app-eth": patch
"@ledgerhq/ledger-wallet-framework": patch
"@ledgerhq/live-cli": patch
---

Consume `@ledgerhq/live-config`, `@ledgerhq/live-env`, `@ledgerhq/live-currency-format`,
`@ledgerhq/domain-service` and `@ledgerhq/evm-tools` from npm instead of the workspace — they
now live in the `ts-libs` repository. No API change.
