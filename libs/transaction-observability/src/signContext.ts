import type { SignedOperation } from "@ledgerhq/types-live";
import { deriveEarnTransactionType, type EarnTransactionType } from "./earnTransactionType";
import { getRawTransactionType, getStakeTarget, type TransactionLike } from "./transactionShape";

/**
 * What the sign stage knows and the broadcast stage does not: the family's own action
 * wording, the delegation target, and send-max.
 */
export type SignContext = {
  earnTransactionType: EarnTransactionType;
  rawTransactionType?: string;
  validators?: string[];
  isSendMax: boolean;
};

/**
 * Correlates the two lifecycle stages.
 *
 * `signOperation` emits a `SignedOperation` and that same object is later handed to
 * `broadcast`, so object identity is the correlation key — no id to invent, nothing to
 * reconcile. A `WeakMap` rather than a keyed cache means there is no TTL, no eviction policy
 * and no size cap to get wrong, and no signature is retained: a transaction that is signed
 * and never broadcast simply becomes garbage. Entries survive a read, so a rebroadcast or a
 * speed-up still correlates.
 *
 * Identity is lost when a signed operation is serialised and rehydrated — the wallet-api
 * `transaction.sign` route across the webview boundary, or one persisted and broadcast later
 * — and ACRE signs outside the wrapper entirely. Those miss and fall back to the operation
 * type, which is why {@link deriveFromOperationType} is still load-bearing.
 */
const contexts = new WeakMap<object, SignContext>();

export function rememberSignContext(
  signedOperation: SignedOperation,
  family: string,
  transaction: TransactionLike | undefined | null,
): void {
  if (!signedOperation || typeof signedOperation !== "object") return;
  const rawTransactionType = getRawTransactionType(transaction);
  const earnTransactionType = deriveEarnTransactionType(family, rawTransactionType);
  // Only a staking action is ever recalled, so storing anything else is churn the broadcast
  // stage never reads — it falls back to the operation type whenever the action is absent.
  if (!earnTransactionType) return;
  contexts.set(signedOperation, {
    earnTransactionType,
    rawTransactionType,
    validators: getStakeTarget(transaction),
    isSendMax: Boolean(transaction?.useAllAmount),
  });
}

export function recallSignContext(
  signedOperation: SignedOperation | undefined | null,
): SignContext | undefined {
  if (!signedOperation || typeof signedOperation !== "object") return undefined;
  return contexts.get(signedOperation);
}

/** Test-only: the map is otherwise invisible, so a leak assertion needs a way in. */
export function hasSignContext(signedOperation: SignedOperation): boolean {
  return contexts.has(signedOperation);
}
