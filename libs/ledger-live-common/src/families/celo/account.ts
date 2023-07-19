import { BigNumber } from "bignumber.js";

export function fromOperationExtraRaw(extra: Record<string, any> | null | undefined) {
  if (extra && extra.celoOperationValue) {
    return { ...extra, celoOperationValue: new BigNumber(extra.celoOperationValue) };
  }
  return extra;
}

export function toOperationExtraRaw(extra: Record<string, any> | null | undefined) {
  if (extra && extra.celoOperationValue) {
    return { ...extra, celoOperationValue: extra.celoOperationValue.toString() };
  }
  return extra;
}

export default {
  fromOperationExtraRaw,
  toOperationExtraRaw,
};
