import { assignFromAccountRaw, assignToAccountRaw } from "@ledgerhq/coin-evm/staking/serialization";

/**
 * EVM-specific hooks that persist `stakingResources` through the
 * `fromAccountRaw` / `toAccountRaw` cycle (the default alpaca pipeline
 * does not serialize family-specific account resources).
 *
 * Kept in a dedicated adapter module — like `families/evm/signer.ts` and
 * `families/evm/bridge.ts` — so that `generic-alpaca/accountBridge.ts`
 * stays family-agnostic and does not need to reach into `@ledgerhq/coin-evm`
 * directly.
 */
export default {
  assignFromAccountRaw,
  assignToAccountRaw,
};
