import BigNumber from "bignumber.js";
import { mergeOps } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import type { Operation, OperationType } from "@ledgerhq/types-live";
import type { RawOperation } from "../types";

/**
 * The fields every operation this family builds shares, whatever account it
 * lands on. `type` and `value` are the caller's to decide: a PLT transfer moves
 * a token amount on the sub-account and a CCD fee on the parent.
 */
export function baseOperation(
  op: RawOperation,
  accountId: string,
  type: OperationType,
  value: BigNumber,
): Operation {
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

/** Maps a transfer onto the account that holds it, parent or sub-account alike. */
export function toOperation(op: RawOperation, accountId: string): Operation {
  return {
    ...baseOperation(op, accountId, op.type, new BigNumber(op.value)),
    extra: op.memo ? { memo: op.memo } : {},
  };
}

/**
 * `mergeOps` with the operations it drops put back.
 *
 * It walks `existing` and pushes an incoming operation only while that
 * operation is at least as recent as the one it is looking at, so anything
 * older than the oldest stored operation is still in its queue when the walk
 * ends, and is never emitted. That is invisible in an incremental sync, which
 * only ever fetches newer blocks, but it silently defeats a re-read from height
 * zero: the older history it went back for is exactly what gets dropped.
 */
export function mergeOperations(existing: Operation[], incoming: Operation[]): Operation[] {
  const merged = mergeOps(existing, incoming);

  const emitted = new Set(merged.map(op => op.id));
  const dropped = incoming.filter(op => !emitted.has(op.id));
  if (dropped.length === 0) return merged;

  return [...merged, ...dropped].sort((a, b) => b.date.valueOf() - a.date.valueOf());
}
