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
import { buildStakingTransactionParams } from "../staking";

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

export function getTransactionType(
  intentType: string,
  feeData?: { gasPrice?: unknown; maxFeePerGas?: unknown },
): TransactionTypes {
  if (intentType === "send-legacy") {
    return TransactionTypes.legacy;
  }

  // For staking, determine type based on fee data
  if (intentType === "staking" && feeData?.gasPrice && !feeData?.maxFeePerGas) {
    return TransactionTypes.legacy;
  }

  return TransactionTypes.eip1559;
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

export async function prepareUnsignedTxParams(
  currency: CryptoCurrency,
  transactionIntent: TransactionIntent<MemoNotSupported>,
): Promise<TransactionLikeWithPreparedParams> {
  const { sender, type } = transactionIntent;

  // Validate intent type first
  if (!["send-legacy", "send-eip1559", "staking"].includes(type)) {
    throw new Error(
      `Unsupported intent type '${type}'. Must be 'send-legacy', 'send-eip1559', or 'staking'`,
    );
  }

  const node = getNodeApi(currency);

  const feeData = await node.getFeeData(currency, {
    type: TransactionTypes.eip1559, // default fee
    feesStrategy: transactionIntent.feesStrategy,
  });

  const transactionType = getTransactionType(type, feeData);

  // Build transaction parameters based on type
  const { to, data, value } =
    type === "staking"
      ? buildStakingTransactionParams(currency, transactionIntent)
      : ((): { to: string; data: Buffer; value: bigint } => {
          const { amount, asset, recipient } = transactionIntent;
          return {
            to: isNative(asset) ? recipient : asset.assetReference || "",
            data: isNative(asset) ? Buffer.from([]) : getErc20Data(recipient, amount),
            value: isNative(asset) ? amount : 0n,
          };
        })();

  const gasLimit = await node.getGasEstimation(
    { currency, freshAddress: sender },
    { amount: BigNumber(value.toString()), recipient: to, data },
  );

  // Re-fetch fee data (changes later need to )
  const finalFeeData =
    transactionType !== TransactionTypes.eip1559
      ? await node.getFeeData(currency, {
          type: transactionType,
          feesStrategy: transactionIntent.feesStrategy,
        })
      : feeData;

  return {
    type: transactionType,
    to,
    data: "0x" + data.toString("hex"),
    value,
    gasLimit,
    feeData: finalFeeData,
  };
}
