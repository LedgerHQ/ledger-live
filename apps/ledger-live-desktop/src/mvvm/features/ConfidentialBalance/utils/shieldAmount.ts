import BigNumber from "bignumber.js";

export type ShieldAmountError = "invalid" | "zero" | "exceedsBalance" | "tooPrecise";

export type ShieldAmount =
  | { amount: bigint; error?: undefined }
  | { amount?: undefined; error: ShieldAmountError | null };

export function getShieldMaxDecimals(magnitude: number, rate: bigint): number {
  const rateDecimals = rate.toString().length - 1;
  return Math.max(0, magnitude - rateDecimals);
}

export function parseShieldAmount(
  input: string,
  magnitude: number,
  rate: bigint,
  publicBalance: BigNumber,
): ShieldAmount {
  if (input.trim() === "") return { error: null };
  const value = new BigNumber(input);
  if (!value.isFinite() || value.isNegative()) return { error: "invalid" };
  if (value.isZero()) return { error: "zero" };
  if ((value.decimalPlaces() ?? 0) > getShieldMaxDecimals(magnitude, rate)) {
    return { error: "tooPrecise" };
  }
  const baseUnits = value.shiftedBy(magnitude);
  if (baseUnits.gt(publicBalance)) return { error: "exceedsBalance" };
  return { amount: BigInt(baseUnits.toFixed(0)) };
}
