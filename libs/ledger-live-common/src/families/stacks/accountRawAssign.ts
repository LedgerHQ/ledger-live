import {
  assignFromAccountRaw,
  assignToAccountRaw,
} from "@ledgerhq/coin-stacks/bridge/serialization";

/**
 * Persists `stakingPositions` through the `fromAccountRaw` / `toAccountRaw` cycle on the
 * generic-coin-framework path, which serializes no family-specific account resources. The Stake
 * action is gated on `stakingPositions !== undefined`, so dropping it on persist would hide Stake
 * after a restart until the next sync.
 *
 * Reuses the classic bridge's own hooks: its `StakingPosition` is the same shape the framework's
 * `toStakingPositionOnAccount` produces. Same pattern as `families/tezos/accountRawAssign.ts`.
 */
export default {
  assignFromAccountRaw,
  assignToAccountRaw,
};
