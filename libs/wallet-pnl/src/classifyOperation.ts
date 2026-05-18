import type { Operation, OperationType } from "@ledgerhq/types-live";
import {
  OPERATION_TYPE_IN_FAMILY,
  OPERATION_TYPE_OUT_FAMILY,
  OPERATION_TYPE_STAKE_FAMILY,
} from "@ledgerhq/ledger-wallet-framework/operation";
import type { OperationFlow } from "./types";

/**
 * Operation types that move asset INTO the account from a cost-basis
 * perspective. Derived from the canonical
 * {@link OPERATION_TYPE_IN_FAMILY} taxonomy of `@ledgerhq/ledger-wallet-framework`,
 * extended with DeFi types not modelled at the framework level
 * (`SUPPLY`, `NFT_IN`).
 */
export const INFLOWS: ReadonlySet<OperationType | string> = new Set<OperationType | string>([
  ...OPERATION_TYPE_IN_FAMILY,
  "NFT_IN",
  "SUPPLY",
]);

/**
 * Operation types that move asset OUT of the account from a cost-basis
 * perspective. Derived from the canonical
 * {@link OPERATION_TYPE_OUT_FAMILY} taxonomy of `@ledgerhq/ledger-wallet-framework`,
 * extended with DeFi types not modelled at the framework level
 * (`REDEEM`, `SELL`, `NFT_OUT`).
 *
 * Note: `OPERATION_TYPE_STAKE_FAMILY` ops (`BOND`, `STAKE`, `APPROVE`,
 * `WITHDRAW_UNBONDED`, ...) are intentionally NOT included — they only move
 * fees, not principal, so they're treated as `"ignored"` by `classifyOperation`.
 */
export const OUTFLOWS: ReadonlySet<OperationType | string> = new Set<OperationType | string>([
  ...OPERATION_TYPE_OUT_FAMILY,
  "NFT_OUT",
  "REDEEM",
  "SELL",
]);

/**
 * Stake-family ops are exposed for callers (and tests) that need to assert
 * they're treated as no-ops by the cost-basis reducer.
 */
export const STAKE_FAMILY: ReadonlySet<OperationType | string> = new Set<OperationType | string>(
  OPERATION_TYPE_STAKE_FAMILY,
);

export function classifyOperation(op: Operation): OperationFlow {
  if (op.hasFailed) return "ignored";
  if (INFLOWS.has(op.type)) return "inflow";
  if (OUTFLOWS.has(op.type)) return "outflow";
  return "ignored";
}
