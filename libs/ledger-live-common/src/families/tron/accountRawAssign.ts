import {
  assignFromAccountRaw,
  assignToAccountRaw,
  fromOperationExtraRaw,
  toOperationExtraRaw,
} from "./serialization";

/**
 * Tron-specific hooks that persist `tronResources` (frozen/unfrozen amounts, votes, rewards) and the
 * staking amounts on `Operation.extra` through the `fromAccountRaw` / `toAccountRaw` cycle — the
 * generic coin framework pipeline is family-agnostic and serializes neither.
 */
export default {
  assignFromAccountRaw,
  assignToAccountRaw,
  fromOperationExtraRaw,
  toOperationExtraRaw,
};
