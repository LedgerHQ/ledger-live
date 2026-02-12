import type {
  BufferTxData,
  FeeEstimation,
  MemoNotSupported,
  TransactionIntent,
} from "@ledgerhq/coin-framework/api/index";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import { Transaction, TransactionLike } from "ethers";
import { getAdditionalLayer2Fees } from "../logic";
import { getGasTracker } from "../network/gasTracker";
import { getNodeApi } from "../network/node";
import { ApiFeeData, ApiGasOptions, FeeData, GasOptions, TransactionTypes } from "../types";
import { isEthAddress } from "../utils";
import { prepareUnsignedTxParams } from "./common";
import { getSequence } from "./getSequence";

async function computeAdditionalFees(
  currency: CryptoCurrency,
  unsignedTransaction: TransactionLike,
): Promise<BigNumber | undefined> {
  // Fake signature is added to get the best approximation possible for the gas on L1
  const transaction: TransactionLike = {
    ...unsignedTransaction,
    signature: {
      r: "0xffffffffffffffffffffffffffffffffffffffff",
      s: "0xffffffffffffffffffffffffffffffffffffffff",
      v: 27,
    },
  };

  try {
    return await getAdditionalLayer2Fees(currency, Transaction.from(transaction).serialized);
  } catch {
    return new BigNumber(0);
  }
}

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

function extractFeeData(data: unknown): FeeData {
  if (!(data && typeof data === "object")) {
    return { gasPrice: null, maxFeePerGas: null, maxPriorityFeePerGas: null, nextBaseFee: null };
  }

  const gasPrice =
    "gasPrice" in data && typeof data.gasPrice === "bigint"
      ? new BigNumber(data.gasPrice.toString())
      : null;
  const maxFeePerGas =
    "maxFeePerGas" in data && typeof data.maxFeePerGas === "bigint"
      ? new BigNumber(data.maxFeePerGas.toString())
      : null;
  const maxPriorityFeePerGas =
    "maxPriorityFeePerGas" in data && typeof data.maxPriorityFeePerGas === "bigint"
      ? new BigNumber(data.maxPriorityFeePerGas.toString())
      : null;
  const nextBaseFee =
    "nextBaseFee" in data && typeof data.nextBaseFee === "bigint"
      ? new BigNumber(data.nextBaseFee.toString())
      : null;

  return { gasPrice, maxFeePerGas, maxPriorityFeePerGas, nextBaseFee };
}

function extractGasOptions(
  customFeesParameters?: FeeEstimation["parameters"],
): GasOptions | undefined {
  const gasOptions = customFeesParameters?.gasOptions;

  if (
    !(
      gasOptions &&
      typeof gasOptions === "object" &&
      "slow" in gasOptions &&
      "medium" in gasOptions &&
      "fast" in gasOptions
    )
  ) {
    return undefined;
  }

  return {
    fast: extractFeeData(gasOptions.fast),
    medium: extractFeeData(gasOptions.medium),
    slow: extractFeeData(gasOptions.slow),
  };
}

export async function estimateFees(
  currency: CryptoCurrency,
  transactionIntent: TransactionIntent<MemoNotSupported, BufferTxData>,
  customFeesParameters?: FeeEstimation["parameters"],
): Promise<FeeEstimation> {
  if (!isEthAddress(transactionIntent.recipient)) {
    return { value: 0n };
  }

  const { type, to, data, value, gasLimit } = await prepareUnsignedTxParams(
    currency,
    transactionIntent,
    customFeesParameters,
  );

  // Some apps including, including Magic Eden, set the nonce to -1
  // instead of simply not providing it.
  // In case of missing or nagative nonce, it must be re-computed.
  const nonce =
    typeof transactionIntent.sequence === "bigint" && transactionIntent.sequence >= 0n
      ? transactionIntent.sequence
      : await getSequence(currency, transactionIntent.sender);
  const chainId = currency.ethereumLikeInfo?.chainId ?? 0;

  const { finalFeeData, finalGasOptions } = await (async (): Promise<{
    finalFeeData: FeeData;
    finalGasOptions?: GasOptions;
  }> => {
    const feesStrategy = transactionIntent.feesStrategy;

    if (feesStrategy === "custom") {
      return { finalFeeData: extractFeeData(customFeesParameters) };
    }

    const customGasOptions = extractGasOptions(customFeesParameters);

    if (customGasOptions && feesStrategy) {
      return { finalFeeData: customGasOptions[feesStrategy], finalGasOptions: customGasOptions };
    }

    const gasTracker = getGasTracker(currency);
    const remoteGasOptions = await gasTracker?.getGasOptions({
      currency,
      options: { useEIP1559: type === TransactionTypes.eip1559 },
    });

    if (remoteGasOptions && feesStrategy) {
      return { finalFeeData: remoteGasOptions[feesStrategy], finalGasOptions: remoteGasOptions };
    }

    const node = getNodeApi(currency);
    const feeData = await node.getFeeData(currency, {
      type,
      feesStrategy: transactionIntent.feesStrategy,
    });

    return { finalFeeData: feeData };
  })();

  // Recompute the transaction type from the fee data, since
  // the one in input may not be supported by the Blockchain
  const finalType =
    finalFeeData.maxFeePerGas && finalFeeData.maxPriorityFeePerGas
      ? TransactionTypes.eip1559
      : TransactionTypes.legacy;

  const gasPrice =
    finalType === TransactionTypes.legacy ? finalFeeData.gasPrice : finalFeeData.maxFeePerGas;
  const fee = gasPrice?.multipliedBy(gasLimit) || new BigNumber(0);

  const unsignedTransaction: TransactionLike = {
    type: finalType,
    to,
    nonce: Number(nonce),
    gasLimit: BigInt(gasLimit.toFixed(0)),
    data,
    value,
    chainId,
  };
  const additionalFees = await computeAdditionalFees(currency, unsignedTransaction);

  return {
    value: BigInt(fee.toString()),
    parameters: {
      ...toApiFeeData(finalFeeData),
      type: finalType,
      additionalFees: additionalFees && BigInt(additionalFees.toFixed()),
      gasLimit: BigInt(gasLimit.toFixed()),
      gasOptions: finalGasOptions && toApiGasOptions(finalGasOptions),
    },
  };
}

export default estimateFees;
