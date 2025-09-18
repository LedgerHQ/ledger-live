import BigNumber from "bignumber.js";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type {
  FeeEstimation,
  MemoNotSupported,
  TransactionIntent,
} from "@ledgerhq/coin-framework/api/index";
import { ApiFeeData, ApiGasOptions, FeeData, GasOptions, TransactionTypes } from "../types";
import { getGasTracker } from "../network/gasTracker";
import { isEthAddress } from "../utils";
import { prepareUnsignedTxParams, isEip55Address } from "./common";

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
  if (!isEthAddress(transactionIntent.recipient) || !isEip55Address(transactionIntent.recipient)) {
    return { value: 0n };
  }

  const { type, gasLimit, feeData } = await prepareUnsignedTxParams(currency, transactionIntent);

  const gasTracker = getGasTracker(currency);
  const gasOptions = await gasTracker?.getGasOptions({
    currency,
    options: { useEIP1559: type === TransactionTypes.eip1559 },
  });
  const gasPrice = type === TransactionTypes.legacy ? feeData.gasPrice : feeData.maxFeePerGas;
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
