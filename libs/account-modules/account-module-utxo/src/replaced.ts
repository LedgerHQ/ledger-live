import type { AccountOperation } from "@ledgerhq/account-module-framework";
import { inputsOf } from "./interpret";

/** Age after which an unconfirmed operation is dropped by {@link removeReplaced}: 2 hours. */
export const DEFAULT_REPLACED_OPERATION_EXPIRY_MS = 2 * 60 * 60 * 1000;

const isConfirmed = (op: AccountOperation): boolean => op.block !== null;
const heightOf = (op: AccountOperation): number => op.block?.height ?? -1;

/**
 * Removes the operations of transactions replaced or double spent. An outpoint is spent once, so
 * of the operations sharing one, the confirmed one wins, then the higher block; at the same height
 * both are kept, unless `preferMostRecentWhenSameHeight` keeps only the later one. Operations
 * spending nothing (coinbase, receive-only) are kept. Unconfirmed operations older than `expiryMs`
 * are dropped. The order of `operations` is preserved.
 */
export function removeReplaced(
  operations: AccountOperation[],
  now: number,
  preferMostRecentWhenSameHeight: boolean,
  expiryMs: number = DEFAULT_REPLACED_OPERATION_EXPIRY_MS,
): AccountOperation[] {
  const byInput = new Map<string, AccountOperation>();
  const kept = new Map<string, AccountOperation>();

  const supersedes = (candidate: AccountOperation, existing: AccountOperation): boolean => {
    if (isConfirmed(existing) !== isConfirmed(candidate)) return isConfirmed(candidate);
    if (heightOf(candidate) !== heightOf(existing)) return heightOf(candidate) > heightOf(existing);
    return preferMostRecentWhenSameHeight && candidate.date.getTime() > existing.date.getTime();
  };

  const isSupersededUnconfirmed = (op: AccountOperation): boolean =>
    !isConfirmed(op) &&
    inputsOf(op).some(input => {
      const existing = byInput.get(input);
      return existing !== undefined && existing.hash !== op.hash && isConfirmed(existing);
    });

  for (const op of operations) {
    const inputs = inputsOf(op);
    if (inputs.length === 0) {
      kept.set(op.hash, op);
      continue;
    }
    for (const input of inputs) {
      const existing = byInput.get(input);
      if (!existing) {
        if (!isSupersededUnconfirmed(op)) {
          byInput.set(input, op);
          kept.set(op.hash, op);
        }
      } else if (isConfirmed(existing) && !isConfirmed(op)) {
        kept.delete(op.hash);
      } else if (supersedes(op, existing)) {
        kept.delete(existing.hash);
        byInput.set(input, op);
        kept.set(op.hash, op);
      } else if (!preferMostRecentWhenSameHeight && heightOf(op) === heightOf(existing)) {
        kept.set(op.hash, op);
      }
    }
  }

  const isExpired = (op: AccountOperation) =>
    !isConfirmed(op) && now > op.date.getTime() + expiryMs;
  return operations.filter(op => kept.has(op.hash) && !isExpired(op));
}
