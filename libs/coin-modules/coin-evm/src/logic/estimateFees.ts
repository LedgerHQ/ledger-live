import type {
  BufferTxData,
  FeeEstimation,
  MemoNotSupported,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import { Transaction, TransactionLike } from "ethers";
import { getAdditionalLayer2Fees } from "../logic";
import { getGasTracker } from "../network/gasTracker";
import { getNodeApi } from "../network/node";
import { ApiFeeData, ApiGasOptions, FeeData, GasOptions, TransactionTypes } from "../types";
import { isEthAddress, isStakingIntent } from "../utils";
import { getTransactionType, prepareUnsignedTxParams } from "./common";
import { getNextSequence } from "./getNextSequence";

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

  // Skip fee estimation for redelegate without a destination validator — the
  // validateStaking step in validateIntent will surface RedelegateDstValAddressRequired.
  if (
    isStakingIntent(transactionIntent) &&
    transactionIntent.mode === "redelegate" &&
    !transactionIntent.dstValAddress
  ) {
    return { value: 0n };
  }

  // Determine the transaction type synchronously so fee-data and gas-estimation
  // requests can be fired in parallel without waiting on each other.
  const txType = getTransactionType(transactionIntent.type);
  const chainId = currency.ethereumLikeInfo?.chainId ?? 0;

  // Some apps, including Magic Eden, set the nonce to -1 instead of simply not
  // providing it. In case of a missing or negative nonce, it must be re-fetched.
  const noncePromise: Promise<bigint> =
    typeof transactionIntent.sequence === "bigint" && transactionIntent.sequence >= 0n
      ? Promise.resolve(transactionIntent.sequence)
      : getNextSequence(currency, transactionIntent.sender);

  const feeDataPromise = (async (): Promise<{
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
      options: { useEIP1559: txType === TransactionTypes.eip1559 },
    });

    if (remoteGasOptions && feesStrategy) {
      return { finalFeeData: remoteGasOptions[feesStrategy], finalGasOptions: remoteGasOptions };
    }

    const node = getNodeApi(currency);
    const feeData = await node.getFeeData(currency, {
      type: txType,
      feesStrategy: transactionIntent.feesStrategy,
    });

    return { finalFeeData: feeData };
  })();

  // Run gas estimation, nonce fetch, and fee-data fetch in parallel — they are
  // all independent network calls and sequencing them triples the latency.
  const [{ to, data, value, gasLimit }, nonce, { finalFeeData, finalGasOptions }] =
    await Promise.all([
      prepareUnsignedTxParams(currency, transactionIntent, customFeesParameters),
      noncePromise,
      feeDataPromise,
    ]);

  // Recompute the transaction type from the fee data, since
  // the one in input may not be supported by the Blockchain.
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
