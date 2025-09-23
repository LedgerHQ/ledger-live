import BigNumber from "bignumber.js";
import { ethers } from "ethers";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type {
  FeeEstimation,
  MemoNotSupported,
  TransactionIntent,
} from "@ledgerhq/coin-framework/api/index";
import ERC20ABI from "../abis/erc20.abi.json";
import {
  ApiFeeData,
  ApiGasOptions,
  isNative,
  TransactionTypes,
  TransactionLikeWithPreparedParams,
} from "../types";
import { getNodeApi } from "../network/node";
import { STAKING_CONTRACTS } from "../staking";
import { StakingOperation } from "../types/staking";
import { encodeStakingData } from "../staking/encoder";

export function isApiGasOptions(options: unknown): options is ApiGasOptions {
  if (!options || typeof options !== "object") return false;

  return (
    "slow" in options &&
    isApiFeeData(options.slow) &&
    "medium" in options &&
    isApiFeeData(options.medium) &&
    "fast" in options &&
    isApiFeeData(options.fast)
  );
}

export function isApiFeeData(fees: unknown): fees is ApiFeeData {
  if (!fees || typeof fees !== "object") return false;

  const isBigIntOrNull = (value: unknown): boolean => value === null || typeof value === "bigint";

  return (
    "maxFeePerGas" in fees &&
    isBigIntOrNull(fees.maxFeePerGas) &&
    "maxPriorityFeePerGas" in fees &&
    isBigIntOrNull(fees.maxPriorityFeePerGas) &&
    "gasPrice" in fees &&
    isBigIntOrNull(fees.gasPrice) &&
    "nextBaseFee" in fees &&
    isBigIntOrNull(fees.nextBaseFee)
  );
}

type LegacyFeeEstimation = FeeEstimation & { parameters: { gasPrice: bigint } };
type Eip1559FeeEstimation = FeeEstimation & {
  parameters: { maxFeePerGas: bigint; maxPriorityFeePerGas: bigint };
};

export function isLegacyFeeEstimation(
  estimation: FeeEstimation,
): estimation is LegacyFeeEstimation {
  return typeof estimation.parameters?.gasPrice === "bigint";
}

export function isEip1559FeeEstimation(
  estimation: FeeEstimation,
): estimation is Eip1559FeeEstimation {
  return (
    typeof estimation.parameters?.maxFeePerGas === "bigint" &&
    typeof estimation.parameters?.maxPriorityFeePerGas === "bigint"
  );
}

export function getTransactionType(intentType: string): TransactionTypes {
  if (!["send-legacy", "send-eip1559"].includes(intentType)) {
    throw new Error(
      `Unsupported intent type '${intentType}'. Must be 'send-legacy' or 'send-eip1559'`,
    );
  }

  return intentType === "send-legacy" ? TransactionTypes.legacy : TransactionTypes.eip1559;
}

export function isEip55Address(address: string): boolean {
  try {
    return address === ethers.getAddress(address);
  } catch {
    return false;
  }
}

export function getErc20Data(recipient: string, amount: bigint): Buffer {
  const contract = new ethers.Interface(ERC20ABI);
  const data = contract.encodeFunctionData("transfer", [recipient, amount]);
  return Buffer.from(data.slice(2), "hex");
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

export async function prepareUnsignedTxParams(
  currency: CryptoCurrency,
  transactionIntent: TransactionIntent<MemoNotSupported>,
): Promise<TransactionLikeWithPreparedParams> {
  const { amount, asset, recipient, sender, type, mode, parameters } = transactionIntent;
  const transactionType = getTransactionType(type);
  const node = getNodeApi(currency);

  const to = isNative(asset) ? recipient : (asset.assetReference as string);
  let data: Buffer;
  const config = STAKING_CONTRACTS[currency.id];
  if (config && mode && isStakingOperation(mode)) {
    data = Buffer.from(
      encodeStakingData({
        currencyId: currency.id,
        operation: mode,
        config,
        params: parameters || [],
      }).slice(2),
      "hex",
    );
  } else {
    data = isNative(asset) ? Buffer.from([]) : getErc20Data(recipient, amount);
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

  return {
    type: transactionType,
    to,
    data: "0x" + data.toString("hex"),
    value,
    gasLimit,
    feeData,
  };
}
