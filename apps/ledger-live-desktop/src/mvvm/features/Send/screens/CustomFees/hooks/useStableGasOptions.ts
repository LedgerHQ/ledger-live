import { useMemo, useRef } from "react";
import type { Transaction } from "@ledgerhq/live-common/generated/types";

/**
 * Preserves gasOptions across bridge prepare cycles.
 * gasOptions can be transiently cleared during prepareTransaction; the Amount screen
 * compensates with useFeePresetOptions. We apply the same pattern here so the
 * descriptor range/helper functions always have access to gasOptions
 */
export function useStableGasOptions(transaction: Transaction): Transaction {
  const gasOptionsRef = useRef<unknown>(null);

  const currentGasOptions =
    "gasOptions" in transaction && transaction.gasOptions ? transaction.gasOptions : null;

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
