import { BigNumber } from "bignumber.js";
import type { FeePresetOption } from "../../../bridge/descriptor/types";
import type { Transaction } from "../../../coin-modules/transaction-types";

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

export function getFeesStrategyForPreset(presetId: string): Transaction["feesStrategy"] | null {
  if (presetId === "slow") return "slow";
  if (presetId === "medium") return "medium";
  if (presetId === "fast") return "fast";
  if (presetId === "custom") return "custom";
  return null;
}

/**
 * Superset of transaction fields that carry a user-entered fee override across
 * families (EVM gas fields, UTXO fee rate, generic `fees`/`customFees`, ...).
 * Clearing all of them reverts a transaction to network-estimated fees.
 * Does NOT include any `feeCurrency*` field: the fee-paying asset is a
 * separate axis and is preserved across this clear.
 */
export function clearFeeOverridesPatch(): Partial<Transaction> {
  return {
    customGasLimit: undefined,
    gasPrice: undefined,
    maxFeePerGas: undefined,
    maxPriorityFeePerGas: undefined,
    feePerByte: undefined,
    customFeeRate: undefined,
    fees: undefined,
    customFees: undefined,
  } as Partial<Transaction>;
}

export function buildPresetEstimationPatch(
  feesStrategy: Transaction["feesStrategy"],
): Partial<Transaction> {
  const patch: Partial<Transaction> = { feesStrategy };

  if (feesStrategy && feesStrategy !== "custom") {
    Object.assign(patch, clearFeeOverridesPatch());
  }

  return patch;
}
