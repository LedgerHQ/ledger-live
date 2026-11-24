import { DEFAULT_SYNC_STATE_DRIVEN, isStateDrivenSync } from "@ledgerhq/coin-near/config";
import type { NearConfig } from "@ledgerhq/coin-near/config";
import type { NearAccount } from "@ledgerhq/coin-near/types";
import type {
  BridgeApi,
  OptimisticOperationDescriptor,
} from "@ledgerhq/ledger-wallet-framework/api/types";
import type { Account, Operation } from "@ledgerhq/types-live";
import { getCurrencyConfiguration } from "../../../config";

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

/**
 * Read at each sync, from LiveConfig: the generic path never runs `setup.ts`, which seeds the
 * legacy config singleton. A config that cannot be read keeps the module default.
 */
function syncsHistoryOnStateChange(): boolean {
  try {
    return isStateDrivenSync(getCurrencyConfiguration<NearConfig>("near"));
  } catch {
    return DEFAULT_SYNC_STATE_DRIVEN;
  }
}

/**
 * The legacy sync keeps its pools in `nearResources`, the generic one in `stakingPositions`: after
 * a switch between the two, a pool may be known to one only. Both count as known pools.
 */
export function getKnownValidatorIds(account: Account): string[] {
  const generic = (
    (account as { stakingPositions?: { delegate?: string }[] }).stakingPositions ?? []
  ).flatMap(({ delegate }) => (delegate ? [delegate] : []));
  const legacy = ((account as Partial<NearAccount>).nearResources?.stakingPositions ?? []).map(
    ({ validatorId }) => validatorId,
  );
  return [...new Set([...generic, ...legacy])];
}

/** The pool `coin-near` found in the transaction's actions, whatever the operation's type. */
export function getStakingCallValidatorId(operation: Operation): string | undefined {
  const { stakingPool } = operation.extra as { stakingPool?: unknown };
  return typeof stakingPool === "string" ? stakingPool : undefined;
}

/** False for an operation the indexer listed before recording its outcome: its fee and status may change. */
export function isOperationSettled(operation: Operation): boolean {
  return (operation.extra as { outcomePending?: unknown }).outcomePending !== true;
}

/** A call relayed by another account may have funded a pool that the data does not name. */
export function needsValidatorListing(operation: Operation): boolean {
  return (operation.extra as { relayedCall?: unknown }).relayedCall === true;
}

export default function nearBridge(): BridgeApi {
  return {
    stakingSupported: true,
    usesStakingPositions: true,
    syncsHistoryOnStateChange: syncsHistoryOnStateChange(),
    getKnownValidatorIds,
    getStakingCallValidatorId,
    isOperationSettled,
    needsValidatorListing,
    computeIntentType,
    describeOptimisticOperation,
  };
}
