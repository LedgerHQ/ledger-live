import { BigNumber } from "bignumber.js";
import type { FeePresetOption } from "../hooks/useFeePresetOptions";

type GasOptionRecord = Record<string, unknown>;

export function isGasOptionRecord(value: unknown): value is GasOptionRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function getGasOptionValue(option: unknown): BigNumber | null {
  if (!isGasOptionRecord(option)) return null;
  const maxFeePerGas = option.maxFeePerGas;
  if (BigNumber.isBigNumber(maxFeePerGas)) return maxFeePerGas;
  const gasPrice = option.gasPrice;
  if (BigNumber.isBigNumber(gasPrice)) return gasPrice;
  return null;
}

export function hasDistinctGasOptions(gasOptions: unknown): boolean {
  if (!isGasOptionRecord(gasOptions)) return false;
  const entries = ["slow", "medium", "fast"]
    .map(key => getGasOptionValue(gasOptions[key]))
    .filter((value): value is BigNumber => value !== null);
  if (entries.length < 2) return false;
  const first = entries[0];
  return entries.some(value => !value.isEqualTo(first));
}

export function formatFeeRate(amount: FeePresetOption["amount"]): string {
  if (!amount?.isFinite() || amount?.isNaN()) return "";
  return amount.integerValue(BigNumber.ROUND_DOWN).toFixed(0);
}
