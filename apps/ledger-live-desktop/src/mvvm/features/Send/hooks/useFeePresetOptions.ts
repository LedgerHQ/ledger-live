import { useMemo, useRef } from "react";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor";
import type { FeePresetOption as DescriptorFeePresetOption } from "@ledgerhq/live-common/bridge/descriptor";
import isEqual from "lodash/isEqual";
import { hasDistinctGasOptions } from "../utils/gas";
import { isEvmTransaction } from "../utils/isEvmTransaction";

export type FeePresetOption = DescriptorFeePresetOption;

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
