import type {
  BufferTxData,
  FeeEstimation,
  MemoNotSupported,
  TransactionIntent,
} from "@ledgerhq/coin-framework/api/index";
import { isSendTransactionIntent } from "@ledgerhq/coin-framework/utils";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import { ethers } from "ethers";
import ERC20ABI from "../abis/erc20.abi.json";
import { getNodeApi } from "../network/node";
import { buildStakingTransactionParams } from "../staking";
import {
  ApiFeeData,
  ApiGasOptions,
  isNative,
  TransactionTypes,
  TransactionLikeWithPreparedParams,
} from "../types";

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
  if (!["send-legacy", "send-eip1559", "staking-legacy", "staking-eip1559"].includes(intentType)) {
    throw new Error(
      `Unsupported intent type '${intentType}'. Must be 'send-legacy', 'send-eip1559', 'staking-legacy', or 'staking-eip1559'`,
    );
  }
  if (intentType === "send-legacy" || intentType === "staking-legacy") {
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

function getCallData(intent: TransactionIntent<MemoNotSupported, BufferTxData>): Buffer {
  const data = intent.data?.value;
  if (Buffer.isBuffer(data) && data.length) return data;
  return isNative(intent.asset) ? Buffer.from([]) : getErc20Data(intent.recipient, intent.amount);
}

export async function prepareUnsignedTxParams(
  currency: CryptoCurrency,
  transactionIntent: TransactionIntent<MemoNotSupported, BufferTxData>,
  customFeesParameters?: FeeEstimation["parameters"],
): Promise<TransactionLikeWithPreparedParams> {
  const { sender, type } = transactionIntent;

  const transactionType = getTransactionType(type);
  const node = getNodeApi(currency);

  // Build transaction parameters based on type
  const { to, data, value } = isSendTransactionIntent(transactionIntent)
    ? ((): { to: string; data: Buffer; value: bigint } => {
        const { amount, asset, recipient } = transactionIntent;
        return {
          to: isNative(asset) ? recipient : (asset.assetReference as string),
          data: getCallData(transactionIntent),
          value: isNative(asset) ? amount : 0n,
        };
      })()
    : buildStakingTransactionParams(currency, transactionIntent);
  const gasLimit =
    typeof customFeesParameters?.gasLimit === "bigint"
      ? BigNumber(customFeesParameters.gasLimit.toString())
      : // Implementations of `getGasEstimation` throw an error when
        // trying to send more token asset than available.
        // Fallback to an estimation of 0 to not break the UI.
        await node
          .getGasEstimation(
            { currency, freshAddress: sender },
            { amount: BigNumber(value.toString()), recipient: to, data },
          )
          .catch(() => new BigNumber(0));

  return {
    type: transactionType,
    to,
    data: "0x" + data.toString("hex"),
    value,
    gasLimit,
  };
}
