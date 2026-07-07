import type {
  BufferTxData,
  CraftedTransaction,
  FeeEstimation,
  MemoNotSupported,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import type { TransactionSerializableEIP1559 } from "viem";
import { serializeTransaction, type TransactionSerializableCIP64 } from "viem/celo";
import { celo } from "viem/chains";
import { getCeloClient } from "../network/client";
import { buildTxParams } from "./buildTxParams";
import { estimateFees } from "./estimateFees";
import type { CeloFeeParameters } from "./types";

/** Use caller-provided fees when present; otherwise price the intent ourselves. */
const resolveFeeParameters = async (
  intent: TransactionIntent<MemoNotSupported, BufferTxData>,
  customFees?: FeeEstimation,
): Promise<CeloFeeParameters> => {
  if (customFees?.parameters) return customFees.parameters as CeloFeeParameters;
  const estimated = await estimateFees(intent, customFees?.parameters);
  return estimated.parameters as CeloFeeParameters;
};

/**
 * Crafts an unsigned, serialized Celo transaction from an intent.
 *
 * Produces an EIP-1559 transaction for native gas, or a CIP-64 transaction when
 * the resolved fee parameters carry a `feeCurrency` (gas paid in an ERC-20).
 * Serialization uses `viem/celo`, the same path the device signer round-trips —
 * the result feeds `combine` (signature attach) then `broadcast`.
 */
export const craftTransaction = async (
  intent: TransactionIntent<MemoNotSupported, BufferTxData>,
  customFees?: FeeEstimation,
): Promise<CraftedTransaction> => {
  const params = await resolveFeeParameters(intent, customFees);
  const { to, data, value, feeCurrency } = await buildTxParams(intent, params.feeCurrency);

  const nonce =
    typeof intent.sequence === "bigint" && intent.sequence >= 0n
      ? Number(intent.sequence)
      : await getCeloClient().getTransactionCount({
          address: intent.sender as `0x${string}`,
          blockTag: "pending",
        });

  const baseFields = {
    // follow the client's configured chain rather than hardcoding mainnet
    chainId: getCeloClient().chain?.id ?? celo.id,
    nonce,
    to,
    value,
    gas: params.gasLimit,
    maxFeePerGas: params.maxFeePerGas,
    maxPriorityFeePerGas: params.maxPriorityFeePerGas,
    data,
  };

  const serializable: TransactionSerializableCIP64 | TransactionSerializableEIP1559 = feeCurrency
    ? { ...baseFields, type: "cip64", feeCurrency }
    : { ...baseFields, type: "eip1559" };

  return {
    transaction: serializeTransaction(serializable),
    details: { type: params.type, ...(feeCurrency ? { feeCurrency } : {}) },
  };
};

export default craftTransaction;
