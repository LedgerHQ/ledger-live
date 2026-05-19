---
"@ledgerhq/coin-tezos": minor
"@ledgerhq/ledger-wallet-framework": minor
"@ledgerhq/live-common": minor
---

Surface Tezos staking positions on the synced account: the generic alpaca `getAccountShape` now branches on a new opt-in `BridgeApi.usesStakingPositions` flag and emits per-position entries (with `delegation-*` / `stake-*` / `unstaking-*` / `finalizable-*` uid prefixes from the Paris upgrade) on `account.stakingPositions` instead of the EVM-shaped `stakingResources` aggregate. Amounts are exposed as `BigNumber` to match the Account-side convention used by `balance`, `spendableBalance`, and `stakingResources`. Adds `coin-tezos` `assignTo/FromAccountRaw` hooks to round-trip these positions through persistence.
