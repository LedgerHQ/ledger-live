import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";

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

export default {
  stakingSupported: true,
  computeIntentType,
} satisfies BridgeApi;
