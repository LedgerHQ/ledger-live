---
"@ledgerhq/types-live": minor
"@ledgerhq/cryptoassets": minor
"@ledgerhq/live-common": minor
"@ledgerhq/coin-aleo": minor
"@ledgerhq/coin-algorand": minor
"@ledgerhq/coin-aptos": minor
"@ledgerhq/coin-bitcoin": minor
"@ledgerhq/coin-canton": minor
"@ledgerhq/coin-cardano": minor
"@ledgerhq/coin-casper": minor
"@ledgerhq/coin-celo": minor
"@ledgerhq/coin-concordium": minor
"@ledgerhq/coin-cosmos": minor
"@ledgerhq/coin-evm": minor
"@ledgerhq/coin-filecoin": minor
"@ledgerhq/coin-hedera": minor
"@ledgerhq/coin-icon": minor
"@ledgerhq/coin-internet_computer": minor
"@ledgerhq/coin-kaspa": minor
"@ledgerhq/coin-mina": minor
"@ledgerhq/coin-module-boilerplate": minor
"@ledgerhq/coin-multiversx": minor
"@ledgerhq/coin-near": minor
"@ledgerhq/coin-polkadot": minor
"@ledgerhq/coin-solana": minor
"@ledgerhq/coin-stacks": minor
"@ledgerhq/coin-stellar": minor
"@ledgerhq/coin-sui": minor
"@ledgerhq/coin-tezos": minor
"@ledgerhq/coin-ton": minor
"@ledgerhq/coin-tron": minor
"@ledgerhq/coin-vechain": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Move the dummy fee-estimation recipient out of `@ledgerhq/cryptoassets` (`abandonseed.ts`, now deleted) into each coin family. Every account bridge now exposes a required `getEstimationRecipient(account)` returning a valid recipient (or throwing for an unmapped currency, like the former `getAbandonSeedAddress`), and the swap layer dispatches through it instead of the central address map.
