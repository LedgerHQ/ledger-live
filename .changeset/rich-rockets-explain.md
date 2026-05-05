---
"@ledgerhq/coin-tezos": minor
"@ledgerhq/ledger-wallet-framework": minor
"@ledgerhq/live-common": minor
---

Surface Tezos staking positions on the synced account: the generic alpaca `getAccountShape` now branches on a new opt-in `BridgeApi.usesStakingPositions` flag and emits the raw `Stake[]` (with `delegation-*` / `stake-*` / `unstaking-*` uid prefixes from the Paris upgrade) on `account.stakingPositions` instead of the EVM-shaped `stakingResources` aggregate. Adds `coin-tezos` `assignTo/FromAccountRaw` hooks to round-trip these positions through persistence.
