import {
  assignFromAccountRaw,
  assignToAccountRaw,
} from "@ledgerhq/coin-hedera/bridge/serialization";

/**
 * Hedera-specific hooks that persist `hederaResources` (token association settings, delegation)
 * through the `fromAccountRaw` / `toAccountRaw` cycle — the generic coin framework pipeline is
 * family-agnostic and does not serialize it.
 */
export default {
  assignFromAccountRaw,
  assignToAccountRaw,
};
