import { BigNumber } from "bignumber.js";
import type { FeePresetOption } from "../hooks/useFeePresetOptions";

export function buildEstimationKey(params: {
  mainAccountId: string;
  recipient: string;
  amount: BigNumber;
  useAllAmount: boolean;
  family: string;
  feePresetOptions: readonly FeePresetOption[];
  fallbackPresetIds?: readonly string[];
}): string {
  const optionsKey = params.feePresetOptions.map(o => `${o.id}:${o.amount.toString()}`).join("|");
  const fallbackKey = params.fallbackPresetIds?.join("|") ?? "";
  return [
    params.mainAccountId,
    params.recipient,
    params.useAllAmount ? "1" : "0",
    params.amount.toString(),
    params.family,
    optionsKey,
    fallbackKey,
  ].join("::");
}
