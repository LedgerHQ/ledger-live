import {
  FEE_INCLUSIVE_OPERATION_TYPES,
  type AccountOperation,
} from "@ledgerhq/account-module-framework";
import type { Operation } from "@ledgerhq/coin-module-framework/api/types";

/** Operations the account sends: it pays their fee and spends a sequence. */
const SENT_TYPES = FEE_INCLUSIVE_OPERATION_TYPES;

/** The type the module gives Ledger Wallet (`details.ledgerOpType`), as the bridge reads it. */
function ledgerTypeOf(op: Operation): string {
  const ledgerOpType = op.details?.["ledgerOpType"];
  return typeof ledgerOpType === "string" ? ledgerOpType : op.type;
}

/** Someone else's transaction that failed: the account paid nothing. */
export const isFailedIncoming = (op: Operation): boolean =>
  op.tx.failed && ledgerTypeOf(op) === "IN";

function operationValue(op: Operation): bigint {
  if (op.tx.failed) return op.tx.fees;
  if (op.asset.type === "native" && SENT_TYPES.has(op.type)) return op.value + op.tx.fees;
  return op.value;
}

/** `details` stays the module's own; the structured memo is `memo`. */
export function toAccountOperation(op: Operation): AccountOperation {
  return {
    id: op.id,
    hash: op.tx.hash,
    type: op.type,
    value: operationValue(op),
    fee: op.tx.fees,
    asset: op.asset,
    senders: op.senders,
    recipients: op.recipients,
    ...(typeof op.tx.feesPayer === "string" ? { feesPayer: op.tx.feesPayer } : {}),
    ...(op.memo === undefined ? {} : { memo: op.memo }),
    block: { height: op.tx.block.height, hash: op.tx.block.hash, time: op.tx.block.time },
    date: op.tx.date,
    failed: op.tx.failed,
    ...(op.details ? { details: op.details } : {}),
  };
}

/** Where an incremental sync resumes: above the highest block holding an operation. */
export const nextHeight = (operations: AccountOperation[]): number =>
  operations.reduce((height, op) => (op.block ? Math.max(height, op.block.height + 1) : height), 0);

/** `details.sequence`: a bigint, an integer, or a decimal string as stored by `craftTransaction`. */
export function sequenceOf(op: AccountOperation): bigint | undefined {
  const sequence = op.details?.sequence;
  if (typeof sequence === "bigint") return sequence;
  if (typeof sequence === "number" && Number.isSafeInteger(sequence)) return BigInt(sequence);
  if (typeof sequence === "string" && /^\d+$/.test(sequence)) return BigInt(sequence);
  return undefined;
}

/** The network sequence, bumped past the ones pending operations already took. */
export const nextSequence = (networkSequence: bigint, pending: AccountOperation[]): bigint =>
  pending.reduce((next, op) => {
    const sequence = sequenceOf(op);
    return sequence !== undefined && sequence >= next ? sequence + 1n : next;
  }, networkSequence);

/** An optimistic operation whose sequence a synced transaction of the account took: replaced. */
export function isSequenceTaken(optimistic: AccountOperation, synced: AccountOperation[]): boolean {
  const sequence = sequenceOf(optimistic);
  if (sequence === undefined) return false;
  return synced.some(op => SENT_TYPES.has(op.type) && (sequenceOf(op) ?? -1n) >= sequence);
}
