import type {
  FeeEstimation,
  MemoNotSupported,
  TransactionIntent,
  TxDataNotSupported,
} from "@ledgerhq/coin-module-framework/api/index";

import { GAS_PRICE } from "../constants";
import { getDefaultGasLimit, isStakingIntent, mapStakingTypeToMode } from "./craftTransaction";

/**
 * Estimates fees for a transaction intent.
 *
 * Fees are deterministic on MultiversX: `fee = gasLimit * gasPrice`. The default
 * gasLimit is derived from the transaction mode via {@link getDefaultGasLimit}
 * (the same helper craftTransaction uses, so the estimate matches what is
 * actually crafted), and gasPrice defaults to the network gas price, falling
 * back to the {@link GAS_PRICE} constant. Both can be overridden through
 * `customFeesParameters`.
 *
 * Intent shape and balance validation are the responsibility of validateIntent;
 * this function assumes a well-formed intent.
 *
 * @param intent - The transaction intent to estimate fees for
 * @param customFeesParameters - Optional custom gasLimit / gasPrice overrides
 * @param networkGasPrice - Optional current network gas price (fetched by the API layer)
 * @returns FeeEstimation with total fee value and gas parameters (gasLimit, gasPrice)
 */
export function estimateFees(
  intent: TransactionIntent<MemoNotSupported, TxDataNotSupported>,
  customFeesParameters?: FeeEstimation["parameters"],
  networkGasPrice?: bigint,
): FeeEstimation {
  const isStaking = isStakingIntent(intent);
  const mode = isStaking ? mapStakingTypeToMode(intent.type) : "send";
  const isEsdtTransfer = !isStaking && intent.asset.type === "esdt";

  const gasLimit =
    customFeesParameters?.gasLimit !== undefined
      ? BigInt(customFeesParameters.gasLimit as bigint | number | string)
      : BigInt(getDefaultGasLimit(mode, isEsdtTransfer));

  const gasPrice =
    customFeesParameters?.gasPrice !== undefined
      ? BigInt(customFeesParameters.gasPrice as bigint | number | string)
      : (networkGasPrice ?? BigInt(GAS_PRICE));

  return {
    value: gasLimit * gasPrice,
    parameters: { gasLimit, gasPrice },
  };
}
