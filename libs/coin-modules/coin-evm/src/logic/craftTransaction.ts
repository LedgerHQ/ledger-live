import {
  BufferTxData,
  CraftedTransaction,
  FeeEstimation,
  MemoNotSupported,
  TransactionIntent,
} from "@ledgerhq/coin-framework/api/types";
import { Transaction, TransactionLike } from "ethers";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { TransactionTypes } from "../types";
import { prepareUnsignedTxParams } from "./common";
import { getSequence } from "./getSequence";

export async function craftTransaction(
  currency: CryptoCurrency,
  {
    transactionIntent,
    customFees,
  }: {
    transactionIntent: TransactionIntent<MemoNotSupported, BufferTxData>;
    customFees?: FeeEstimation | undefined;
  },
): Promise<CraftedTransaction> {
  const { sender } = transactionIntent;

  const { type, to, data, value, gasLimit, feeData } = await prepareUnsignedTxParams(
    currency,
    transactionIntent,
  );

  const nonce = await getSequence(currency, sender);
  const chainId = currency.ethereumLikeInfo?.chainId ?? 0;

  const unsignedTransaction: TransactionLike = {
    type,
    to,
    nonce,
    gasLimit: BigInt(gasLimit.toFixed(0)),
    data,
    value,
    chainId,
    ...(feeData.gasPrice ? { gasPrice: BigInt(feeData.gasPrice.toFixed(0)) } : {}),
    ...(feeData.maxFeePerGas ? { maxFeePerGas: BigInt(feeData.maxFeePerGas.toFixed(0)) } : {}),
    ...(feeData.maxPriorityFeePerGas
      ? { maxPriorityFeePerGas: BigInt(feeData.maxPriorityFeePerGas.toFixed(0)) }
      : {}),
  };

  if (type === TransactionTypes.legacy && typeof customFees?.parameters?.gasPrice === "bigint") {
    unsignedTransaction.gasPrice = customFees.parameters.gasPrice;
  }

  if (
    type === TransactionTypes.eip1559 &&
    typeof customFees?.parameters?.maxFeePerGas === "bigint" &&
    typeof customFees?.parameters?.maxPriorityFeePerGas === "bigint"
  ) {
    unsignedTransaction.maxFeePerGas = customFees.parameters.maxFeePerGas;
    unsignedTransaction.maxPriorityFeePerGas = customFees.parameters.maxPriorityFeePerGas;
  }

  return { transaction: Transaction.from(unsignedTransaction).unsignedSerialized };
}
