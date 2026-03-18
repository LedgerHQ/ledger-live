import { useMemo, useRef } from "react";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import { isEvmTransaction } from "../../../utils/isEvmTransaction";

/**
 * Preserves gasOptions across bridge prepare cycles.
 * gasOptions can be transiently cleared during prepareTransaction; the Amount screen
 * compensates with useFeePresetOptions. We apply the same pattern here so the
 * descriptor range/helper functions always have access to gasOptions
 */
export function useStableGasOptions(transaction: Transaction): Transaction {
  const gasOptionsRef = useRef<unknown>(null);
  const isEvm = isEvmTransaction(transaction);

  const currentGasOptions = isEvm && transaction.gasOptions ? transaction.gasOptions : null;

  if (currentGasOptions !== null) {
    gasOptionsRef.current = currentGasOptions;
  } else if (!isEvm) {
    gasOptionsRef.current = null;
  }

  return useMemo(() => {
    if (!isEvm) return transaction;

    const gasOptions = currentGasOptions ?? gasOptionsRef.current;
    if (gasOptions && gasOptions !== currentGasOptions) {
      return { ...transaction, gasOptions } as Transaction;
    }
    return transaction;
  }, [transaction, currentGasOptions, isEvm]);
}
