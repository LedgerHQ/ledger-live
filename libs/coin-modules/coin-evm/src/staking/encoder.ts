import { ethers } from "ethers";
import type {
  EncodeStakingDataParams,
  StakingContractConfig,
  StakingOperation,
} from "../types/staking";
import { getStakingABI } from "./abis";

export const encodeStakingData = (encodeParams: EncodeStakingDataParams): string => {
  const { currencyId, operation, config, params } = encodeParams;

  const abi = getStakingABI(currencyId);
  if (!abi) {
    throw new Error(`No ABI found for staking currency: ${currencyId}`);
  }

  const functionName = config.functions[operation];
  if (!functionName) {
    throw new Error(`Operation '${operation}' not supported for currency: ${currencyId}`);
  }

  const iface = new ethers.Interface(abi);
  return iface.encodeFunctionData(functionName, params);
};

export const decodeStakingResult = (
  currencyId: string,
  operation: StakingOperation,
  config: StakingContractConfig,
  result: string,
): ethers.Result => {
  const abi = getStakingABI(currencyId);
  if (!abi) {
    throw new Error(`No ABI found for staking currency: ${currencyId}`);
  }

  const functionName = config.functions[operation];
  if (!functionName) {
    throw new Error(`Operation '${operation}' not supported for currency: ${currencyId}`);
  }

  const iface = new ethers.Interface(abi);
  return iface.decodeFunctionResult(functionName, result);
};
