---
"@ledgerhq/types-live": minor
"@ledgerhq/cryptoassets": minor
"@ledgerhq/live-common": minor
"@ledgerhq/coin-aleo": patch
"@ledgerhq/coin-algorand": patch
"@ledgerhq/coin-aptos": patch
"@ledgerhq/coin-bitcoin": patch
"@ledgerhq/coin-canton": patch
"@ledgerhq/coin-cardano": patch
"@ledgerhq/coin-casper": patch
"@ledgerhq/coin-celo": patch
"@ledgerhq/coin-concordium": patch
"@ledgerhq/coin-cosmos": patch
"@ledgerhq/coin-evm": patch
"@ledgerhq/coin-filecoin": patch
"@ledgerhq/coin-hedera": patch
"@ledgerhq/coin-icon": patch
"@ledgerhq/coin-internet_computer": patch
"@ledgerhq/coin-kaspa": patch
"@ledgerhq/coin-mina": patch
"@ledgerhq/coin-module-boilerplate": patch
"@ledgerhq/coin-multiversx": patch
"@ledgerhq/coin-near": patch
"@ledgerhq/coin-polkadot": patch
"@ledgerhq/coin-solana": patch
"@ledgerhq/coin-stacks": patch
"@ledgerhq/coin-stellar": patch
"@ledgerhq/coin-sui": patch
"@ledgerhq/coin-tezos": patch
"@ledgerhq/coin-ton": patch
"@ledgerhq/coin-tron": patch
"@ledgerhq/coin-vechain": patch
"ledger-live-desktop": patch
"live-mobile": patch
---

Move the dummy fee-estimation recipient out of `@ledgerhq/cryptoassets` (`abandonseed.ts`, now deleted) into each coin family. Every account bridge now exposes a required `getEstimationRecipient(account)` returning a valid recipient (or throwing for an unmapped currency, like the former `getAbandonSeedAddress`), and the swap layer dispatches through it instead of the central address map.
