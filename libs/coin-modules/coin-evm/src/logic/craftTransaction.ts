import {
  BufferTxData,
  CraftedTransaction,
  FeeEstimation,
  MemoNotSupported,
  TransactionIntent,
} from "@ledgerhq/coin-framework/api/types";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Transaction, TransactionLike } from "ethers";
import { getNodeApi } from "../network/node";
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
  const { type, to, data, value, gasLimit } = await prepareUnsignedTxParams(
    currency,
    transactionIntent,
    customFees?.parameters,
  );

  // Some apps including, including Magic Eden, set the nonce to -1
  // instead of simply not providing it.
  // In case of missing or nagative nonce, it must be re-computed.
  const nonce =
    typeof transactionIntent.sequence === "bigint" && transactionIntent.sequence >= 0n
      ? transactionIntent.sequence
      : await getSequence(currency, transactionIntent.sender);
  const chainId = currency.ethereumLikeInfo?.chainId ?? 0;

  const unsignedTransaction: TransactionLike = {
    type,
    to,
    nonce: Number(nonce),
    gasLimit: BigInt(gasLimit.toFixed(0)),
    data,
    value,
    chainId,
  };

  let hasFeeData = false;

  if (type === TransactionTypes.legacy && typeof customFees?.parameters?.gasPrice === "bigint") {
    unsignedTransaction.gasPrice = customFees.parameters.gasPrice;
    hasFeeData = true;
  }

  if (
    type === TransactionTypes.eip1559 &&
    typeof customFees?.parameters?.maxFeePerGas === "bigint" &&
    typeof customFees?.parameters?.maxPriorityFeePerGas === "bigint"
  ) {
    unsignedTransaction.maxFeePerGas = customFees.parameters.maxFeePerGas;
    unsignedTransaction.maxPriorityFeePerGas = customFees.parameters.maxPriorityFeePerGas;
    hasFeeData = true;
  }

  if (!hasFeeData) {
    const node = getNodeApi(currency);
    const feeData = await node.getFeeData(currency, {
      type,
      feesStrategy: transactionIntent.feesStrategy,
    });

    if (type === TransactionTypes.legacy && feeData.gasPrice) {
      unsignedTransaction.gasPrice = BigInt(feeData.gasPrice.toFixed(0));
    }

    if (type === TransactionTypes.eip1559 && feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
      unsignedTransaction.maxFeePerGas = BigInt(feeData.maxFeePerGas.toFixed(0));
      unsignedTransaction.maxPriorityFeePerGas = BigInt(feeData.maxPriorityFeePerGas.toFixed(0));
    }
  }

  return { transaction: Transaction.from(unsignedTransaction).unsignedSerialized };
}
