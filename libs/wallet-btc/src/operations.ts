// Chain-agnostic UTXO operation-replacement (RBF) accounting, shared by UTXO coin-modules.
// Extracted verbatim from coin-bitcoin's synchronisation so it can be reused (e.g. coin-zcash
// transparent) without depending on coin-bitcoin. It operates on a structural, LL-agnostic
// operation shape — no @ledgerhq/types-live / cryptoassets coupling.

const TWO_HOUR_MS = 2 * 60 * 60 * 1000;
const COINBASE_INPUT_PREFIX = "0000000000000000000000000000000000000000000000000000000000000000";

/** Minimal structural shape of an operation needed by the replacement accounting. */
export type ReplaceableOperation = {
  hash: string;
  date: string | number | Date;
  blockHeight?: number | null | undefined;
  extra?: { inputs?: string[] | undefined } | undefined;
};

/**
 * Removes replaced Bitcoin transactions based on inputs and RBF logic.
 *
 * This function is used primarily to handle Replace-By-Fee (RBF) transactions.
 * In some situations, we might fetch both the original (unconfirmed) transaction
 * and the one that replaces it (usually with a higher fee). Without deduplication, both can
 * remain displayed, confusing the user—especially when the replaced one never confirms.
 *
 * Key Rules:
 * - A UTXO (input) can only be spent once.
 * - If multiple transactions share an input, we keep the one that is:
 *   1. Confirmed (has a `blockHeight`) over an unconfirmed one.
 *   2. Of higher `blockHeight` if both are confirmed or both are unconfirmed.
 *   3. When both share the same `blockHeight` (or both lack one), both are kept by
 *      default; pass `preferMostRecentWhenSameHeight` to instead keep only the one
 *      with the later `date`.
 * - Coinbase transactions (with input starting with all 0s) are exempt from the
 *   input-based replacement above (coinbase txs are always confirmed, so the expiry
 *   below never applies to them).
 * - Transactions without `extra.inputs` (usually `OUT` transactions) are exempt from
 *   the input-based replacement above.
 * - Regardless of the rules above, the final result also drops every unconfirmed
 *   operation older than 2 hours (this expiry applies to all ops, including no-input
 *   ones).
 *
 * Outcome:
 * The result is a filtered list of operations, cleaned of unconfirmed or superseded
 * transactions that were replaced using RBF logic or similar, and of stale
 * (older-than-2h) unconfirmed operations. The original order of operations is preserved.
 */
export const removeReplaced = <T extends ReplaceableOperation>(
  operations: T[],
  now = Date.now(),
  preferMostRecentWhenSameHeight = false,
): T[] => {
  const isConfirmed = (op: T): boolean => typeof op.blockHeight === "number";
  const getInputs = (op: T): string[] => op.extra?.inputs ?? [];
  const isCoinbase = (op: T): boolean =>
    getInputs(op).some((input: string) => input.startsWith(COINBASE_INPUT_PREFIX));
  const toDateMs = (op: T): number => new Date(op.date).getTime();

  const shouldReplaceExistingOperation = (existingOp: T, op: T): boolean => {
    const existingConfirmed = isConfirmed(existingOp);
    const newConfirmed = isConfirmed(op);

    if (existingConfirmed && !newConfirmed) return false;
    if (!existingConfirmed && newConfirmed) return true;

    const newHeight = op.blockHeight ?? -1;
    const existingHeight = existingOp.blockHeight ?? -1;

    if (newHeight !== existingHeight) return newHeight > existingHeight;
    if (!preferMostRecentWhenSameHeight) return false;
    return toDateMs(op) > toDateMs(existingOp);
  };

  const shouldKeepBothWhenSameHeight = (existingOp: T, op: T): boolean => {
    if (preferMostRecentWhenSameHeight) return false;
    return (op.blockHeight ?? -1) === (existingOp.blockHeight ?? -1);
  };

  const isSupersededUnconfirmedOperation = (op: T, txByInput: Map<string, T>) =>
    !isConfirmed(op) &&
    getInputs(op).some((input: string) => {
      const existing = txByInput.get(input);
      return existing !== undefined && existing.hash !== op.hash && isConfirmed(existing);
    });

  const isExpiredUnconfirmed = (op: T): boolean =>
    !isConfirmed(op) && now > toDateMs(op) + TWO_HOUR_MS;

  const addOperationForInput = (
    input: string,
    op: T,
    txByInput: Map<string, T>,
    uniqueOperations: Map<string, T>,
  ): void => {
    txByInput.set(input, op);
    uniqueOperations.set(op.hash, op);
  };

  const handleInput = (
    input: string,
    op: T,
    txByInput: Map<string, T>,
    uniqueOperations: Map<string, T>,
  ): void => {
    const existingOp = txByInput.get(input);

    if (!existingOp) {
      if (!isSupersededUnconfirmedOperation(op, txByInput)) {
        addOperationForInput(input, op, txByInput, uniqueOperations);
      }
      return;
    }

    if (isConfirmed(existingOp) && !isConfirmed(op)) {
      uniqueOperations.delete(op.hash);
      return;
    }

    if (shouldReplaceExistingOperation(existingOp, op)) {
      uniqueOperations.delete(existingOp.hash);
      addOperationForInput(input, op, txByInput, uniqueOperations);
      return;
    }

    if (shouldKeepBothWhenSameHeight(existingOp, op)) {
      uniqueOperations.set(op.hash, op);
    }
  };

  // used to track the most recent operation for each input.
  const txByInput = new Map<string, T>();

  // ensures we maintain a list of unique transactions by hash.
  const uniqueOperations = new Map<string, T>(); // Keep track of unique transactions

  for (const op of operations) {
    const inputs = getInputs(op);
    if (inputs.length === 0) {
      uniqueOperations.set(op.hash, op);
      continue;
    }

    if (isCoinbase(op)) {
      uniqueOperations.set(op.hash, op);
      continue;
    }

    for (const input of inputs) {
      handleInput(input, op, txByInput, uniqueOperations);
    }
  }

  return operations.filter(op => uniqueOperations.has(op.hash) && !isExpiredUnconfirmed(op));
};

// wallet-btc limitation: returns all transactions twice (for each side of the tx)
// so we need to deduplicate them...
export const deduplicateOperations = <T extends { id: string }>(
  operations: (T | undefined)[],
): T[] => {
  const seen = new Set<string>();
  const out: T[] = [];
  let j = 0;

  for (const operation of operations) {
    if (operation) {
      if (!seen.has(operation.id)) {
        seen.add(operation.id);
        out[j++] = operation;
      }
    }
  }

  return out;
};
