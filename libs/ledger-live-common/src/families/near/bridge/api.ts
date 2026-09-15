import type {
  BridgeApi,
  OptimisticOperationDescriptor,
} from "@ledgerhq/ledger-wallet-framework/api/types";

/**
 * NEAR names its staking modes `stake` / `unstake` / `withdraw`, while the generic framework's
 * default mapping only knows `stake` / `unstake` / `finalize_unstake` and throws on anything else.
 */
export function computeIntentType(transaction: Record<string, unknown>): string {
  const { mode } = transaction;
  if (mode == null) {
    return "send";
  }
  if (typeof mode !== "string") {
    throw new TypeError(`Unsupported transaction mode: ${JSON.stringify(mode)}`);
  }
  switch (mode) {
    case "send":
    case "stake":
    case "unstake":
      return mode;
    case "withdraw":
      return "finalize_unstake";
    default:
      throw new Error(`Unsupported transaction mode: ${mode}`);
  }
}

/**
 * NEAR's indexer classifies a withdraw as `WITHDRAW_UNSTAKED` (`coin-near/network/indexer.ts`),
 * and so does the legacy bridge's optimistic operation. The framework's default mapping resolves
 * the `withdraw` mode to `WITHDRAW_UNBONDED` instead, so without this the pending row would carry
 * a type the following sync never produces: it would relabel itself once the operation confirms,
 * and until then `getMaxAmount` — which subtracts pending withdrawals by matching
 * `WITHDRAW_UNSTAKED` — would not see it and would offer the same funds for withdrawal twice.
 *
 * `stake` and `unstake` already agree with the default mapping, so they are left to it.
 */
export function describeOptimisticOperation(
  mode: string,
): OptimisticOperationDescriptor | undefined {
  return mode === "withdraw" ? { type: "WITHDRAW_UNSTAKED" } : undefined;
}

export default {
  stakingSupported: true,
  usesStakingPositions: true,
  computeIntentType,
  describeOptimisticOperation,
} satisfies BridgeApi;
