import BigNumber from "bignumber.js";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type {
  FeeEstimation,
  MemoNotSupported,
  TransactionIntent,
} from "@ledgerhq/coin-framework/api/index";
import { TransactionTypes } from "ethers/lib/utils";
import { getNodeApi } from "../network/node";
import { ApiFeeData, ApiGasOptions, FeeData, GasOptions, isNative } from "../types";
import { getGasTracker } from "../network/gasTracker";
import { getErc20Data, getTransactionType } from "./common";

function toApiFeeData(feeData: FeeData): ApiFeeData {
  return {
    gasPrice: feeData.gasPrice && BigInt(feeData.gasPrice.toFixed()),
    maxFeePerGas: feeData.maxFeePerGas && BigInt(feeData.maxFeePerGas.toFixed()),
    maxPriorityFeePerGas:
      feeData.maxPriorityFeePerGas && BigInt(feeData.maxPriorityFeePerGas.toFixed()),
    nextBaseFee: feeData.nextBaseFee && BigInt(feeData.nextBaseFee.toFixed()),
  };
}

function toApiGasOptions(options: GasOptions): ApiGasOptions {
  return {
    fast: toApiFeeData(options.fast),
    medium: toApiFeeData(options.medium),
    slow: toApiFeeData(options.slow),
  };
}

export async function estimateFees(
  currency: CryptoCurrency,
  transactionIntent: TransactionIntent<MemoNotSupported>,
): Promise<FeeEstimation> {
  const { amount, asset, recipient, sender, type } = transactionIntent;

  const transactionType = getTransactionType(type);
  const node = getNodeApi(currency);
  const gasTracker = getGasTracker(currency);
  const to = isNative(asset) ? recipient : (asset.assetReference as string);
  const data = isNative(asset) ? Buffer.from([]) : getErc20Data(recipient, amount);
  const value = isNative(asset) ? amount : 0n;
  const gasLimit = await node.getGasEstimation(
    { currency, freshAddress: sender },
    { amount: BigNumber(value.toString()), recipient: to, data },
  );
  const feeData = await node.getFeeData(currency, {
    type: transactionType,
    feesStrategy: transactionIntent.feesStrategy,
  });
  const gasOptions = await gasTracker?.getGasOptions({
    currency,
    options: { useEIP1559: transactionType === TransactionTypes.eip1559 },
  });
  const gasPrice =
    transactionType === TransactionTypes.legacy ? feeData.gasPrice : feeData.maxFeePerGas;
  const fee = gasPrice?.multipliedBy(gasLimit) || new BigNumber(0);

  return {
    value: BigInt(fee.toString()),
    parameters: {
      ...toApiFeeData(feeData),
      gasLimit: BigInt(gasLimit.toFixed()),
      gasOptions: gasOptions && toApiGasOptions(gasOptions),
    },
  };
}

export default estimateFees;
