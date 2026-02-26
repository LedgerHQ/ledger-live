import { useMemo, useRef } from "react";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor";
import type { FeePresetOption as DescriptorFeePresetOption } from "@ledgerhq/live-common/bridge/descriptor";
import isEqual from "lodash/isEqual";

export type FeePresetOption = DescriptorFeePresetOption;

function isEvmTransaction(
  transaction: Transaction,
): transaction is Transaction & { gasOptions?: unknown } {
  return transaction.family === "evm";
}

function hasDistinctGasOptions(gasOptions: unknown): boolean {
  if (!gasOptions || typeof gasOptions !== "object") return false;
  const opts = gasOptions as Record<string, unknown>;
  const values = Object.values(opts);
  if (values.length === 0) return false;
  const firstValue = JSON.stringify(values[0]);
  return values.slice(1).some(v => JSON.stringify(v) !== firstValue);
}

export function useFeePresetOptions(
  currency: CryptoOrTokenCurrency | undefined,
  transaction: Transaction,
): readonly FeePresetOption[] {
  const lastValidGasOptionsRef = useRef<unknown>(null);
  const isEvm = isEvmTransaction(transaction);
  const currentGasOptions = isEvm ? transaction.gasOptions : null;
  const hasDistinct = hasDistinctGasOptions(currentGasOptions);

  if (isEvm && hasDistinct && !isEqual(lastValidGasOptionsRef.current, currentGasOptions)) {
    lastValidGasOptionsRef.current = currentGasOptions;
  }

  const effectiveTransaction = useMemo(() => {
    if (!isEvm) return transaction;
    const gasOptions = hasDistinct ? currentGasOptions : lastValidGasOptionsRef.current;
    return gasOptions ? { ...transaction, gasOptions } : transaction;
  }, [currentGasOptions, hasDistinct, isEvm, transaction]);

  return useMemo(
    () => sendFeatures.getFeePresetOptions(currency, effectiveTransaction),
    [currency, effectiveTransaction],
  );
}
