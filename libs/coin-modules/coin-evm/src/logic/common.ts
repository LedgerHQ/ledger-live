import { ethers } from "ethers";
import { TransactionTypes } from "ethers/lib/utils";
import { FeeEstimation } from "@ledgerhq/coin-framework/api/types";
import ERC20ABI from "../abis/erc20.abi.json";
import { ApiFeeData, ApiGasOptions } from "../types";

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

export function getErc20Data(recipient: string, amount: bigint): Buffer {
  const contract = new ethers.utils.Interface(ERC20ABI);
  const data = contract.encodeFunctionData("transfer", [recipient, amount]);
  return Buffer.from(data.slice(2), "hex");
}
