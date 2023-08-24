import { BigNumber } from "bignumber.js";

export function fromOperationExtraRaw(extra: Record<string, any> | null | undefined) {
  if (extra && extra.transferAmount) {
    extra = { ...extra, transferAmount: extra.transferAmount.toString() };
  }

  if (extra && extra.bondedAmount) {
    return { ...extra, bondedAmount: new BigNumber(extra.bondedAmount) };
  }

  if (extra && extra.unbondedAmount) {
    return { ...extra, unbondedAmount: new BigNumber(extra.unbondedAmount) };
  }

  if (extra && extra.withdrawUnbondedAmount) {
    return {
      ...extra,
      withdrawUnbondedAmount: new BigNumber(extra.withdrawUnbondedAmount),
    };
  }

  // for subscan reward & slash
  if (extra && extra.amount) {
    return { ...extra, amount: new BigNumber(extra.amount) };
  }

  return extra;
}
export function toOperationExtraRaw(extra: Record<string, any> | null | undefined) {
  if (extra && extra.transferAmount) {
    extra = { ...extra, transferAmount: extra.transferAmount.toString() };
  }

  if (extra && extra.bondedAmount) {
    return { ...extra, bondedAmount: extra.bondedAmount.toString() };
  }

  if (extra && extra.unbondedAmount) {
    return { ...extra, unbondedAmount: extra.unbondedAmount.toString() };
  }

  if (extra && extra.withdrawUnbondedAmount) {
    return {
      ...extra,
      withdrawUnbondedAmount: extra.withdrawUnbondedAmount.toString(),
    };
  }

  // for subscan reward & slash
  if (extra && extra.amount) {
    return { ...extra, amount: extra.amount.toString() };
  }

  return extra;
}
