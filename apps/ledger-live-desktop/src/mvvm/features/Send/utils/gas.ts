import { BigNumber } from "bignumber.js";
import { formatFeeRate as formatFeeRateCore } from "@ledgerhq/live-common/flows/send/utils/gas";

type GasOptionRecord = Record<string, unknown>;

export function formatFeeRate(amount: BigNumber | undefined): string {
  return formatFeeRateCore(amount);
}

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
