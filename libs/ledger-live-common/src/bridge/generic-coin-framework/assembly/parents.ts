import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import type { SubOperationIndex } from "@ledgerhq/ledger-wallet-framework/serialization";
import BigNumber from "bignumber.js";
import groupBy from "lodash/groupBy";
import type { OperationCommon } from "../types";
import { cleanedOperation } from "../utils";

export function isInternalLiveOp(operation: OperationCommon): boolean {
  return !!operation.extra?.internal;
}

/** True when the op is a main-account (native) op, not a token/sub-account op */
export function isNativeLiveOp(operation: OperationCommon): boolean {
  const assetReference = operation.extra?.assetReference;
  const assetOwner = operation.extra?.assetOwner;
  const hasAssetReference = typeof assetReference === "string" && assetReference.length > 0;
  const hasAssetOwner = typeof assetOwner === "string" && assetOwner.length > 0;

  // Native ops are those that do not have a non-empty asset reference/owner
  return !(hasAssetReference || hasAssetOwner);
}

/**
 * Parent recipients for token-only ops: use the token contract (assetReference), not the token transfer recipient.
 */
export function getTokenContract(op: OperationCommon): string | undefined {
  const ref = op.extra?.assetReference;
  return typeof ref === "string" && ref.length > 0 ? ref : undefined;
}

/** Get the fee payer for this tx from the op (from API/extra). */
export function getFeePayer(op: OperationCommon): string | undefined {
  const fp = op.extra?.feePayer;
  return typeof fp === "string" && fp.length > 0 ? fp : undefined;
}

/** Compare two addresses for equality, ignoring case. */
function isSameAddress(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

/** True when the native op is outbound with value equal to fee (fees-only). */
export function isFeesOnlyNativeOp(op: OperationCommon): boolean {
  return op.type === "OUT" && op.value !== null && op.fee != null && op.value.eq(op.fee);
}

/** Emit one parent op per native op: FEES when fees-only, otherwise passthrough. */
export function parentOpsFromNativeOps(
  nativeOps: OperationCommon[],
  accountId: string,
  subOperations: OperationCommon[],
  internalOperations: OperationCommon[],
): OperationCommon[] {
  const out: OperationCommon[] = [];
  for (const nativeOp of nativeOps) {
    // Native outgoing operation with value 0 (only fees) => output as single FEES op
    if (isFeesOnlyNativeOp(nativeOp)) {
      out.push(
        cleanedOperation({
          id: encodeOperationId(accountId, nativeOp.hash, "FEES"),
          hash: nativeOp.hash,
          accountId,
          type: "FEES",
          value: nativeOp.fee,
          fee: nativeOp.fee,
          blockHash: nativeOp.blockHash,
          blockHeight: nativeOp.blockHeight,
          senders: nativeOp.senders,
          recipients: nativeOp.recipients,
          date: nativeOp.date,
          transactionSequenceNumber: nativeOp.transactionSequenceNumber,
          hasFailed: nativeOp.hasFailed,
          extra: nativeOp.extra,
          subOperations,
          internalOperations,
        }),
      );
    }
    // Otherwise, don't transform the operation
    else {
      out.push(
        cleanedOperation({
          ...nativeOp,
          subOperations,
          internalOperations,
        }),
      );
    }
  }
  return out;
}

/** One synthetic FEES or NONE parent when the tx has no native ops (e.g. token-only). */
export function syntheticParentForTokenOnlyTx(
  referenceOp: OperationCommon,
  accountId: string,
  address: string,
  subOperations: OperationCommon[],
  internalOperations: OperationCommon[],
): OperationCommon {
  // Parent op is FEES only when the account actually paid a fee; NONE otherwise. A zero fee (e.g. a
  // token send whose energy/bandwidth is fully covered) is not a FEES row — it stays hidden as NONE
  // rather than surfacing an empty "0 fee" parent. An undefined fee is treated as paid, preserving the
  // prior behaviour for ops synced without a fee value.
  const feePayer = getFeePayer(referenceOp);
  const isFeePayer = feePayer !== undefined && isSameAddress(address, feePayer);
  const paysFee = isFeePayer && !referenceOp.fee?.isZero();
  const parentType = paysFee ? "FEES" : "NONE";
  const parentValue = paysFee ? referenceOp.fee : new BigNumber(0);
  // In the case of smart contract interaction, the contract must be the recipient of the parent operation => this
  // is why we need to extract this information from the operation details.
  const contract = getTokenContract(referenceOp);
  const parentRecipients = contract === undefined ? (referenceOp.recipients ?? []) : [contract];
  const parentSenders = referenceOp.senders ?? [];
  return cleanedOperation({
    id: encodeOperationId(accountId, referenceOp.hash, parentType),
    hash: referenceOp.hash,
    accountId,
    type: parentType,
    value: parentValue,
    fee: referenceOp.fee,
    blockHash: referenceOp.blockHash,
    blockHeight: referenceOp.blockHeight,
    senders: parentSenders,
    recipients: parentRecipients,
    date: referenceOp.date,
    transactionSequenceNumber: referenceOp.transactionSequenceNumber,
    hasFailed: referenceOp.hasFailed,
    extra: referenceOp.extra,
    subOperations,
    internalOperations,
  });
}

/** Parent op(s) for a tx that has non-internal ops (native and/or token). */
export function parentOpsForTxWithNonInternalOperations(
  hash: string,
  transactionOps: OperationCommon[],
  internalOperations: OperationCommon[],
  subOperationIndex: SubOperationIndex,
  accountId: string,
  address: string,
): OperationCommon[] {
  const nativeOps = transactionOps.filter(isNativeLiveOp);
  // subOperationIndex holds types-live Operation[]; we use OperationCommon in this bridge
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- framework type vs bridge type
  const subOperations = (subOperationIndex.get(hash) ?? []) as OperationCommon[];

  // If transaction has native ops, use them as parents
  if (nativeOps.length > 0)
    return parentOpsFromNativeOps(nativeOps, accountId, subOperations, internalOperations);

  // If transaction has no native ops, create a synthetic parent
  const firstOp = transactionOps[0];
  return [
    syntheticParentForTokenOnlyTx(firstOp, accountId, address, subOperations, internalOperations),
  ];
}

/**
 * Synthetic NONE parent for a tx that has only internal ops (e.g. contract transfer from B to C).
 * This case happens when an address A calls a smart contract, that performs a transfer from B to C,
 * seen from B or C's perspective. The parent operation is of type NONE, with A as the sender
 * (empty if unknown) and the contract as the recipient. Internal ops are attached to the NONE parent,
 * not emitted as additional top-level operations.
 */
export function parentOpsForTxWithOnlyInternalOperations(
  hash: string,
  internalOperations: OperationCommon[],
  subOperationIndex: SubOperationIndex,
  accountId: string,
): OperationCommon[] {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- framework type vs bridge type
  const subOperations = (subOperationIndex.get(hash) ?? []) as OperationCommon[];
  const firstInternal = internalOperations[0];
  if (!firstInternal) return [];

  const feePayer = getFeePayer(firstInternal);
  return [
    cleanedOperation({
      id: encodeOperationId(accountId, hash, "NONE"),
      hash,
      accountId,
      type: "NONE",
      value: new BigNumber(0),
      fee: firstInternal.fee,
      blockHash: firstInternal.blockHash,
      blockHeight: firstInternal.blockHeight,
      senders: feePayer ? [feePayer] : [],
      recipients: firstInternal.senders,
      date: firstInternal.date,
      transactionSequenceNumber: firstInternal.transactionSequenceNumber,
      hasFailed: firstInternal.hasFailed,
      extra: firstInternal.extra,
      subOperations,
      internalOperations,
    }),
  ];
}

/**
 * Emit parent operations per tx hash: one top-level operation per transaction for normal transactions,
 * two for self-sends (IN + OUT). Internal-only transactions produce a single NONE parent with internal
 * ops attached, not emitted as additional top-level operations.
 */
export function buildParentOperations(
  // Built once for all transactions rather than once per hash: the group-once pattern below
  // already applies to the other side of this join (transactions grouped by hash); this applies it
  // to the sub-account side.
  subOperationIndex: SubOperationIndex,
  newNonInternalOperations: OperationCommon[],
  newInternalOperations: OperationCommon[],
  accountId: string,
  address: string,
): OperationCommon[] {
  const nonInternalByHash = groupBy(newNonInternalOperations, "hash");
  const internalByHash = groupBy(newInternalOperations, "hash");

  const result: OperationCommon[] = [];

  // Inspect non-internal ops first to create parent ops
  for (const [hash, transactionOps] of Object.entries(nonInternalByHash)) {
    const internalOperations = internalByHash[hash] ?? [];
    result.push(
      ...parentOpsForTxWithNonInternalOperations(
        hash,
        transactionOps,
        internalOperations,
        subOperationIndex,
        accountId,
        address,
      ),
    );
  }

  // If transaction only has internal ops, we must create a synthetic parent op as well
  for (const [hash, internalOperations] of Object.entries(internalByHash)) {
    if (hash in nonInternalByHash) continue;
    result.push(
      ...parentOpsForTxWithOnlyInternalOperations(
        hash,
        internalOperations,
        subOperationIndex,
        accountId,
      ),
    );
  }

  return result;
}

/**
 * Points each parent at the token rows `subOperationIndex` holds for its hash -- what restoring the
 * account computes from its stored sub-accounts. A parent whose links already match is returned
 * as-is, so an unchanged history allocates nothing.
 */
export function relinkSubOperations(
  operations: OperationCommon[],
  subOperationIndex: SubOperationIndex,
): OperationCommon[] {
  return operations.map(op => {
    const linked = subOperationIndex.get(op.hash) ?? [];
    const current = op.subOperations ?? [];
    // By reference, not id: `mergeOps` keeps an unchanged token row's object and replaces a row it
    // updated under the same id, so an id match alone would leave the parent holding the old row.
    const unchanged =
      current.length === linked.length && current.every((sub, i) => sub === linked[i]);
    return unchanged ? op : { ...op, subOperations: linked };
  });
}
