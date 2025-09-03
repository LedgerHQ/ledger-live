import { FeeEstimation, TransactionIntent } from "@ledgerhq/coin-framework/api/types";
import { Transaction, TransactionLike } from "ethers";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import { isNative, TransactionTypes } from "../types";
import { getNodeApi } from "../network/node";
import { getErc20Data, getTransactionType } from "./common";
import { getSequence } from "./getSequence";

export async function craftTransaction(
  currency: CryptoCurrency,
  {
    transactionIntent,
    customFees,
  }: {
    transactionIntent: TransactionIntent;
    customFees?: FeeEstimation | undefined;
  },
): Promise<string> {
  const { amount, asset, recipient, sender, type } = transactionIntent;

  const transactionType = getTransactionType(type);
  const node = getNodeApi(currency);
  const to = isNative(asset) ? recipient : (asset?.assetReference as string);
  const nonce = await getSequence(currency, sender);
  const data = isNative(asset) ? Buffer.from([]) : getErc20Data(recipient, amount);
  const value = isNative(asset) ? amount : 0n;
  const chainId = currency.ethereumLikeInfo?.chainId ?? 0;
  const gasLimit = await node.getGasEstimation(
    { currency, freshAddress: sender },
    { amount: BigNumber(value.toString()), recipient: to, data },
  );
  const fee = await node.getFeeData(currency, { type: transactionType });

  const unsignedTransaction: TransactionLike = {
    type: transactionType,
    to,
    nonce,
    gasLimit: BigInt(gasLimit.toFixed(0)),
    data: "0x" + data.toString("hex"),
    value,
    chainId,
    ...(fee.gasPrice ? { gasPrice: BigInt(fee.gasPrice.toFixed(0)) } : {}),
    ...(fee.maxFeePerGas ? { maxFeePerGas: BigInt(fee.maxFeePerGas.toFixed(0)) } : {}),
    ...(fee.maxPriorityFeePerGas
      ? { maxPriorityFeePerGas: BigInt(fee.maxPriorityFeePerGas.toFixed(0)) }
      : {}),
  };

  if (
    transactionType === TransactionTypes.legacy &&
    typeof customFees?.parameters?.gasPrice === "bigint"
  ) {
    unsignedTransaction.gasPrice = customFees.parameters.gasPrice;
  }

  if (
    transactionType === TransactionTypes.eip1559 &&
    typeof customFees?.parameters?.maxFeePerGas === "bigint" &&
    typeof customFees?.parameters?.maxPriorityFeePerGas === "bigint"
  ) {
    unsignedTransaction.maxFeePerGas = customFees.parameters.maxFeePerGas;
    unsignedTransaction.maxPriorityFeePerGas = customFees.parameters.maxPriorityFeePerGas;
  }

  return Transaction.from(unsignedTransaction).unsignedSerialized;
}
