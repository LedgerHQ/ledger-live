import { FeeEstimation, TransactionIntent } from "@ledgerhq/coin-framework/api/types";
import { ethers } from "ethers";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import { TransactionTypes } from "ethers/lib/utils";
import { isNative } from "../types";
import { getNodeApi } from "../network/node";
import ERC20ABI from "../abis/erc20.abi.json";

function getErc20Data(recipient: string, amount: bigint): Buffer {
  const contract = new ethers.utils.Interface(ERC20ABI);
  const data = contract.encodeFunctionData("transfer", [recipient, amount]);
  return Buffer.from(data.slice(2), "hex");
}

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

  if (!["send-legacy", "send-eip1559"].includes(type)) {
    throw new Error(`Unsupported intent type '${type}'. Must be 'send-legacy' or 'send-eip1559'`);
  }

  const node = getNodeApi(currency);
  const to = isNative(asset) ? recipient : (asset?.assetReference as string);
  const nonce = await node.getTransactionCount(currency, sender);
  const data = isNative(asset) ? Buffer.from([]) : getErc20Data(recipient, amount);
  const value = isNative(asset) ? amount : 0n;
  const chainId = currency.ethereumLikeInfo?.chainId ?? 0;
  const gasLimit = await node.getGasEstimation(
    { currency, freshAddress: sender },
    { amount: BigNumber(value.toString()), recipient: to, data },
  );
  const transactionType =
    type === "send-legacy" ? TransactionTypes.legacy : TransactionTypes.eip1559;
  const fee = await node.getFeeData(currency, { type: transactionType });

  const unsignedTransaction: ethers.utils.UnsignedTransaction = {
    type: transactionType,
    to,
    nonce,
    gasLimit: ethers.BigNumber.from(gasLimit.toFixed(0)),
    data,
    value,
    chainId,
    ...(fee.gasPrice ? { gasPrice: ethers.BigNumber.from(fee.gasPrice.toFixed(0)) } : {}),
    ...(fee.maxFeePerGas
      ? { maxFeePerGas: ethers.BigNumber.from(fee.maxFeePerGas.toFixed(0)) }
      : {}),
    ...(fee.maxPriorityFeePerGas
      ? { maxPriorityFeePerGas: ethers.BigNumber.from(fee.maxPriorityFeePerGas.toFixed(0)) }
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

  return ethers.utils.serializeTransaction(unsignedTransaction);
}
