import {
  BufferTxData,
  CraftedTransaction,
  FeeEstimation,
  FeesStrategy,
  MemoNotSupported,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/types";
import { Transaction, TransactionLike } from "ethers";
import { GasEstimationError } from "../errors";
import type { EvmContext } from "../config";
import { getNodeApi } from "../network/node";
import { TransactionTypes } from "../types";
import { prepareUnsignedTxParams } from "./common";
import { getNextSequence } from "./getNextSequence";

export async function craftTransaction(
  context: EvmContext,
  currencyId: string,
  {
    transactionIntent,
    customFees,
  }: {
    transactionIntent: TransactionIntent<MemoNotSupported, BufferTxData>;
    customFees?: FeeEstimation | undefined;
  },
): Promise<CraftedTransaction> {
  const config = await context.config(currencyId);
  const { type, to, data, value, gasLimit } = await prepareUnsignedTxParams(
    config,
    currencyId,
    transactionIntent,
    customFees?.parameters,
  );

  // Never send a failed estimation to the device: the node rejects it as "intrinsic gas too low".
  if (gasLimit.lte(0)) {
    throw new GasEstimationError();
  }

  // Some apps, including Magic Eden, set the nonce to -1
  // instead of simply not providing it.
  // In case of missing or negative nonce, it must be re-computed.
  const nonce =
    typeof transactionIntent.sequence === "bigint" && transactionIntent.sequence >= 0n
      ? transactionIntent.sequence
      : await getNextSequence(context, currencyId, transactionIntent.sender);
  const chainId = config.chainId;

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
    const node = getNodeApi(config, currencyId);
    const feeData = await node.getFeeData(config, currencyId, {
      type,
      feesStrategy: customFees?.parameters?.feesStrategy as FeesStrategy | undefined,
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
