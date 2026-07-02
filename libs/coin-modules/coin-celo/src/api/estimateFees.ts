import type {
  BufferTxData,
  FeeEstimation,
  MemoNotSupported,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import { CELO_STAKING_FALLBACK_GAS_LIMIT, MAX_FEES_THRESHOLD_MULTIPLIER } from "../constants";
import { celoEstimateGas } from "../network/client";
import { getFeeMarketGasParams } from "../network/sdk";
import { buildTxParams } from "./buildTxParams";
import { resolveFeeCurrency } from "./feeCurrency";
import { isCeloStakingIntent } from "./stakingIntent";
import type { CeloFeeParameters } from "./types";

/**
 * Heuristic for an EVM execution revert (vs a transient/network failure). Used to
 * decide whether a failed staking gas estimation may safely fall back to a fixed
 * ceiling — a revert usually means a prerequisite step is not yet on-chain (e.g.
 * estimating a `vote` before locking), whereas a transient error must surface.
 */
const isRevertLike = (error: unknown): boolean => {
  const message = (error instanceof Error ? error.message : String(error)).toLowerCase();
  // A transient/transport failure must surface even if its wrapped message
  // happens to mention a revert — never mask it with the fixed-gas fallback.
  if (/timeout|timed out|econn|socket|network|fetch failed|request failed/.test(message)) {
    return false;
  }
  return (
    message.includes("revert") ||
    message.includes("execution error") ||
    message.includes("out of gas") ||
    message.includes("invalid opcode")
  );
};

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
