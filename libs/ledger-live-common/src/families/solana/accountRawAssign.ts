import {
  assignFromAccountRaw,
  assignFromTokenAccountRaw,
  assignToAccountRaw,
  assignToTokenAccountRaw,
  fromOperationExtraRaw,
  toOperationExtraRaw,
} from "@ledgerhq/coin-solana/serialization";

/**
 * Solana-specific hooks that persist `stakingResources` (and revive accounts still holding the
 * older `solanaResources` blob), the Token-2022 fields of a token sub-account, plus the staking
 * amounts on `Operation.extra`, through the
 * `fromAccountRaw` / `toAccountRaw` cycle — the generic coin framework pipeline is
 * family-agnostic and serializes neither.
 */
export default {
  assignFromAccountRaw,
  assignToAccountRaw,
  assignFromTokenAccountRaw,
  assignToTokenAccountRaw,
  fromOperationExtraRaw,
  toOperationExtraRaw,
};
