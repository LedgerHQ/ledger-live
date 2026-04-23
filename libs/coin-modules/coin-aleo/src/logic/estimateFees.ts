import BigNumber from "bignumber.js";
import invariant from "invariant";
import type { FeeEstimation } from "@ledgerhq/coin-module-framework/api/types";
import type { TransactionType, AleoCoinConfig } from "../types";
import { resolveConfig } from "./utils";

export function estimateFees({
  configOrCurrencyId,
  transactionType,
}: {
  configOrCurrencyId: AleoCoinConfig | string;
  transactionType: TransactionType;
}): FeeEstimation {
  const config = resolveConfig(configOrCurrencyId);

  if (config.isFeeSponsored) {
    return {
      value: BigInt(0),
    };
  }

  const fee = config.feeByTransactionType[transactionType];
  invariant(typeof fee === "number", `aleo: missing fee configuration for ${transactionType}`);

  const value = new BigNumber(fee)
    .multipliedBy(config.feeSafetyMultiplier)
    .integerValue(BigNumber.ROUND_CEIL);

  return {
    value: BigInt(value.toString()),
  };
}
