import BigNumber from "bignumber.js";

export function fromOperationExtraRaw(
  extra: Record<string, any> | null | undefined
): Record<string, any> | null | undefined {
  if (!extra) return extra;

  const { nonce } = extra;

  if (nonce !== undefined) extra = { ...extra, nonce: new BigNumber(nonce) };

  return extra;
}

export function toOperationExtraRaw(
  extra: Record<string, any> | null | undefined
): Record<string, any> | null | undefined {
  if (!extra) return extra;

  const { nonce } = extra;

  if (nonce !== undefined) extra = { ...extra, nonce: nonce.toFixed() };

  return extra;
}

export default {
  fromOperationExtraRaw,
  toOperationExtraRaw,
};
