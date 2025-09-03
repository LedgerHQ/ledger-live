import BigNumber from "bignumber.js";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type {
  FeeEstimation,
  MemoNotSupported,
  TransactionIntent,
} from "@ledgerhq/coin-framework/api/index";
import { ApiFeeData, ApiGasOptions, FeeData, GasOptions, TransactionTypes } from "../types";
import { encodeStakingData, getStakingContractConfig } from "../staking";
import type { StakingOperation } from "../types/staking";
import { getGasTracker } from "../network/gasTracker";
import { prepareUnsignedTxParams } from "./common";

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

const stakingOperations = [
  "delegate",
  "undelegate",
  "redelegate",
  "getStakedBalance",
  "getUnstakedBalance",
] as const;

function isStakingOperation(value: string): value is StakingOperation {
  return (stakingOperations as readonly string[]).includes(value);
}

export async function estimateFees(
  currency: CryptoCurrency,
  transactionIntent: TransactionIntent<MemoNotSupported>,
): Promise<FeeEstimation> {
  const { type, gasLimit, feeData, mode, validator } = await prepareUnsignedTxParams(currency, transactionIntent);

  const gasTracker = getGasTracker(currency);
  const to = isNative(asset) ? recipient : (asset.assetReference as string);
  let data: Buffer;
  const config = getStakingContractConfig(currency.id);
  console.log("config", config, mode, isStakingOperation(mode));
  if (config && mode && isStakingOperation(mode)) {
    data = Buffer.from(
      encodeStakingData({
        currencyId: currency.id,
        operation: mode,
        config,
        params: [validator],
      }).slice(2),
      "hex",
    );
  console.log("data", data);
  } else {
    data = isNative(asset) ? Buffer.from([]) : getErc20Data(recipient, amount);
    console.log("data2", data);
  }
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
