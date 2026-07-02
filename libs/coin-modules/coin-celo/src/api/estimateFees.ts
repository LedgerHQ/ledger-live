import type {
  BufferTxData,
  FeeEstimation,
  MemoNotSupported,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import { CELO_STAKING_FALLBACK_GAS_LIMIT, MAX_FEES_THRESHOLD_MULTIPLIER } from "../constants";
import { celoEstimateGas } from "../network/client";
import { isRevertLike } from "../network/rpcErrors";
import { getFeeMarketGasParams } from "../network/sdk";
import { buildTxParams } from "./buildTxParams";
import { resolveFeeCurrency } from "./feeCurrency";
import { isCeloStakingIntent } from "./stakingIntent";
import type { CeloFeeParameters } from "./types";

/**
 * Estimates the network fee for a Celo transaction intent, honoring CIP-64 fee
 * abstraction (gas paid in an ERC-20 such as USDC/USDT).
 *
 * The fee currency is read from `customFeesParameters.feeCurrency` (a token
 * contract or adapter address) because the framework `TransactionIntent` has no
 * fee-currency field. The returned `parameters` ({@link CeloFeeParameters}) are
 * passed straight back into `craftTransaction` to build the priced transaction.
 *
 * Gas units are inflated by {@link MAX_FEES_THRESHOLD_MULTIPLIER} (matching the
 * Celo bridge) to absorb estimation drift between estimate and broadcast.
 */
export const estimateFees = async (
  intent: TransactionIntent<MemoNotSupported, BufferTxData>,
  customFeesParameters?: FeeEstimation["parameters"],
): Promise<FeeEstimation> => {
  const feeCurrency = resolveFeeCurrency(customFeesParameters?.feeCurrency as string | undefined);
  const { to, data, value } = await buildTxParams(intent, feeCurrency);

  const { maxFeePerGas, maxPriorityFeePerGas } = await getFeeMarketGasParams(feeCurrency);

  // Only a revert (see isRevertLike) may fall back to a fixed ceiling; transient failures must surface.
  let gasLimit: bigint;
  try {
    const estimatedGas = await celoEstimateGas({
      from: intent.sender as `0x${string}`,
      to,
      data,
      value,
      ...(feeCurrency ? { feeCurrency } : {}),
    });
    gasLimit = estimatedGas * BigInt(MAX_FEES_THRESHOLD_MULTIPLIER);
  } catch (error) {
    if (!isCeloStakingIntent(intent) || !isRevertLike(error)) throw error;
    gasLimit = CELO_STAKING_FALLBACK_GAS_LIMIT;
  }

  const parameters: CeloFeeParameters = {
    maxFeePerGas,
    maxPriorityFeePerGas,
    gasLimit,
    ...(feeCurrency ? { feeCurrency } : {}),
    type: feeCurrency ? "cip64" : "eip1559",
  };

  return { value: maxFeePerGas * gasLimit, parameters };
};

export default estimateFees;
