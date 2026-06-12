import { useMemo, useRef } from "react";
import type { Transaction } from "../../../../coin-modules/transaction-types";

type WithGasOptions = { gasOptions?: unknown };

/**
 * Preserves `gasOptions` across bridge prepare cycles.
 *
 * `gasOptions` can be transiently cleared during prepareTransaction; the Amount
 * screen compensates with useFeePresetOptions. We apply the same pattern here so
 * the descriptor range/helper functions always have access to gasOptions.
 *
 * Kept family-agnostic on purpose: only transactions that carry a `gasOptions`
 * field are affected, the cache is reset whenever the transaction family changes.
 */
export function useStableGasOptions(transaction: Transaction): Transaction {
  const gasOptionsRef = useRef<unknown>(null);
  const familyRef = useRef<string>(transaction.family);

  if (familyRef.current !== transaction.family) {
    familyRef.current = transaction.family;
    gasOptionsRef.current = null;
  }

  const candidate =
    "gasOptions" in transaction ? (transaction as WithGasOptions).gasOptions : undefined;
  const currentGasOptions = candidate != null ? candidate : null;

  if (currentGasOptions !== null) {
    gasOptionsRef.current = currentGasOptions;
  }

  return useMemo(() => {
    const gasOptions = currentGasOptions ?? gasOptionsRef.current;
    if (gasOptions && gasOptions !== currentGasOptions) {
      return { ...transaction, gasOptions } as Transaction;
    }
    return transaction;
  }, [transaction, currentGasOptions]);
}
