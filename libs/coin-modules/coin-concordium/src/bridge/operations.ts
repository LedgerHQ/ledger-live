import BigNumber from "bignumber.js";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { inferSubOperations } from "@ledgerhq/ledger-wallet-framework/serialization/index";
import type { Operation, OperationType, TokenAccount } from "@ledgerhq/types-live";
import type { ConcordiumOperation, ConcordiumOperationExtra, RawOperation } from "../types";

/**
 * Spread conditionally rather than assigned: `exactOptionalPropertyTypes` is on,
 * so an explicit `undefined` does not satisfy an optional field.
 */
function operationExtra(op: RawOperation): ConcordiumOperationExtra {
  return {
    ...(op.memo === undefined ? {} : { memo: op.memo }),
    ...(op.rejectCode === undefined ? {} : { pltRejectCode: op.rejectCode }),
  };
}

/**
 * The fields every operation this family builds shares. `type` and `value` are
 * the caller's: one PLT transfer moves a token on the sub-account and a CCD fee
 * on the parent.
 */
export function baseOperation(
  op: RawOperation,
  accountId: string,
  type: OperationType,
  value: BigNumber,
): ConcordiumOperation {
  return {
    id: encodeOperationId(accountId, op.hash, type),
    hash: op.hash,
    accountId,
    type,
    value,
    fee: new BigNumber(op.fee),
    blockHash: op.blockHash,
    blockHeight: op.blockHeight,
    senders: [op.sender],
    // A rejected transaction reports no destination, and `[""]` would render as
    // a recipient the chain never saw.
    recipients: op.recipient ? [op.recipient] : [],
    date: op.date,
    hasFailed: op.failed,
    extra: {},
  };
}

/**
 * Returns `ConcordiumOperation` so this write is checked against the type the
 * renderers read; annotating it `Operation` would leave `extra` as `unknown` and
 * a mistyped key would compile on both sides.
 */
export function toOperation(op: RawOperation, accountId: string): ConcordiumOperation {
  return {
    ...baseOperation(op, accountId, op.type, new BigNumber(op.value)),
    extra: operationExtra(op),
  };
}

/**
 * Hangs each PLT transfer under the CCD operation that paid its fee. Done here
 * because a parent is built before the sub-accounts it points at exist.
 *
 * Gated on the parent types so the scan costs the PLT slice of the history
 * rather than all of it; a native transfer never shares a hash with a token
 * operation. Skipping it only affects this sync — `fromOperationRaw` infers the
 * same links when the account is read back.
 */
export function attachSubOperations(
  operations: Operation[],
  subAccounts: TokenAccount[],
): Operation[] {
  if (subAccounts.length === 0) return operations;

  return operations.map(op => {
    if (op.type !== "FEES" && op.type !== "NONE") return op;

    const subOperations = inferSubOperations(op.hash, subAccounts);
    return subOperations.length > 0 ? { ...op, subOperations } : op;
  });
}
