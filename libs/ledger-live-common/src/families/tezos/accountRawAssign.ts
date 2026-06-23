import { assignFromAccountRaw, assignToAccountRaw } from "./serialization";

/**
 * Tezos-specific hooks that persist `stakingPositions` through the
 * `fromAccountRaw` / `toAccountRaw` cycle (the default generic-coin-framework
 * pipeline does not serialize family-specific account resources).
 *
 * Mirrors the EVM adapter pattern (`families/evm/accountRawAssign.ts`),
 * keeping `generic-coin-framework/accountRawAssign.ts` family-agnostic.
 */
export default {
  assignFromAccountRaw,
  assignToAccountRaw,
};
