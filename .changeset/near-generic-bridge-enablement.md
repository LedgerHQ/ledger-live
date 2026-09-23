---
"@ledgerhq/live-common": minor
"@ledgerhq/coin-near": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Route NEAR through the generic coin-framework bridge (LIVE-36413).

- `live-common`: NEAR added to `genericCoinFrameworkFamilies.json`, gated on a new LiveConfig key `config_near_generic_bridge` (default `false`) so the route ships dormant and can be enabled or rolled back remotely. `families/near/accountRawAssign.ts` carries both `stakingPositions` and the legacy `nearResources` blob through serialization, in each direction, so an account persisted before the migration keeps the data the UI falls back to. `families/near/bridge/api.ts` declares `describeOptimisticOperation`, typing a pending withdrawal `WITHDRAW_UNSTAKED` to match what the indexer produces rather than the generic `WITHDRAW_UNBONDED`, which `getMaxAmount` would not have netted out.
- `coin-near`: `Transaction.fees` widened to `BigNumber | null` and `nonce` added, both round-tripping through `transaction.ts`. Fees serialize with `toFixed`, so a yocto-denominated fee no longer persists in exponential notation, and a missing nonce revives as zero instead of sending `signOperation` into the unimplemented `getNextSequence`. `preload-data.ts` seeds the gas price with the protocol minimum, so `canStake` no longer prices staking at zero on a route that never runs `preload()`.
