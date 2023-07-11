import BigNumber from "bignumber.js";

export function fromOperationExtraRaw(
  extra: Record<string, any> | null | undefined,
): Record<string, any> | null | undefined {
  if (!extra) return extra;

  const { gasLimit, gasPremium, gasFeeCap } = extra;

  if (gasLimit !== undefined) extra = { ...extra, gasLimit: new BigNumber(gasLimit) };

  if (gasPremium !== undefined) extra = { ...extra, gasPremium: new BigNumber(gasPremium) };

  if (gasFeeCap !== undefined) extra = { ...extra, gasFeeCap: new BigNumber(gasFeeCap) };

  return extra;
}

export function toOperationExtraRaw(
  extra: Record<string, any> | null | undefined,
): Record<string, any> | null | undefined {
  if (!extra) return extra;

  const { gasLimit, gasPremium, gasFeeCap } = extra;

  if (gasLimit !== undefined) extra = { ...extra, gasLimit: gasLimit.toNumber() };

  if (gasPremium !== undefined) extra = { ...extra, gasPremium: gasPremium.toFixed() };

  if (gasFeeCap !== undefined) extra = { ...extra, gasFeeCap: gasFeeCap.toFixed() };

  return extra;
}

export default {
  fromOperationExtraRaw,
  toOperationExtraRaw,
};
