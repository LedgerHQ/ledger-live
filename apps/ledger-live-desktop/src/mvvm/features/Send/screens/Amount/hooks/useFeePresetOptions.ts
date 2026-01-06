import { useMemo, useRef } from "react";
import { BigNumber } from "bignumber.js";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor";
import type { FeePresetOption as DescriptorFeePresetOption } from "@ledgerhq/live-common/bridge/descriptor";
import isEqual from "lodash/isEqual";
import { isEvmTransaction } from "../utils/isEvmTransaction";

export type FeePresetOption = DescriptorFeePresetOption;

type GasOptionRecord = Record<string, unknown>;

function isGasOptionRecord(value: unknown): value is GasOptionRecord {
  return typeof value === "object" && value !== null;
}

function getGasOptionValue(option: unknown): BigNumber | null {
  if (!isGasOptionRecord(option)) return null;
  const maxFeePerGas = option.maxFeePerGas;
  if (BigNumber.isBigNumber(maxFeePerGas)) return maxFeePerGas;
  const gasPrice = option.gasPrice;
  if (BigNumber.isBigNumber(gasPrice)) return gasPrice;
  return null;
}

function hasDistinctGasOptions(gasOptions: unknown): boolean {
  if (!isGasOptionRecord(gasOptions)) return false;
  const entries = ["slow", "medium", "fast"]
    .map(key => getGasOptionValue(gasOptions[key]))
    .filter((value): value is BigNumber => value !== null);
  if (entries.length < 2) return false;
  const first = entries[0];
  return entries.some(value => !value.isEqualTo(first));
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
