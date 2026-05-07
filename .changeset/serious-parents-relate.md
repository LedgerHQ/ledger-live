---
"@ledgerhq/coin-tezos": minor
---

Surface Paris staking operations through `listOperations` and `getBlock`. TzKT `type: "staking"` ops are now parsed and emitted with operation types `STAKE`, `UNSTAKE`, and `FINALIZE_UNSTAKE`. `getBlock` additionally fetches `staking` ops via `fetchBlockStaking` and merges them into the block's `BlockTransaction` list with `details.operationType` set. `APIStakingType` was corrected to use `action` (the actual TzKT field name) rather than `kind`, with `staker`, `baker`, `requestedAmount`, `stakingUpdatesCount`, and `counter` typed as well.
