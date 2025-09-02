import type { StakingOperation } from "../types/staking";
import { getStakingContractConfig } from "./config";
import { encodeStakingData } from "./encoder";

export type StakingTransactionType = StakingOperation;

export interface GenerateStakingDataParams {
  recipient: string;
  amount: bigint;
  transactionType: StakingTransactionType;
  currencyId: string;
  sourceValidator?: string; // rquired for redelegate
}

const buildTransactionParams = (
  currencyId: string,
  transactionType: StakingTransactionType,
  recipient: string,
  amount: bigint,
  sourceValidator?: string,
): unknown[] => {
  // Sei EVM contract
  if (currencyId === "sei_network_evm") {
    switch (transactionType) {
      case "getStakedBalance":
      case "delegate":
        return [recipient];
      case "undelegate":
        return [recipient, amount];
      case "redelegate":
        if (!sourceValidator) {
          throw new Error("Source validator is required for redelegate operation");
        }
        return [sourceValidator, recipient, amount];
      default:
        throw new Error(`Unsupported transaction type: ${transactionType}`);
    }
  }

  // Celo contract
  if (currencyId === "celo") {
    switch (transactionType) {
      case "delegate":
      case "undelegate":
        return [recipient, amount];
      case "getStakedBalance":
      case "getUnstakedBalance":
        return [recipient];
      default:
        throw new Error(`Unsupported transaction type: ${transactionType}`);
    }
  }

  throw new Error(`Unsupported staking currency: ${currencyId}`);
};

export const generateStakingTransactionData = (params: GenerateStakingDataParams): Buffer => {
  const { currencyId, transactionType, recipient, amount, sourceValidator } = params;

  const config = getStakingContractConfig(currencyId);
  if (!config) {
    throw new Error(`No staking configuration found for currency: ${currencyId}`);
  }

  const transactionParams = buildTransactionParams(
    currencyId,
    transactionType,
    recipient,
    amount,
    sourceValidator,
  );

  const encodedData = encodeStakingData({
    currencyId,
    operation: transactionType,
    config,
    params: transactionParams,
  });

  // Remove '0x' prefix and convert to Buffer
  return Buffer.from(encodedData.slice(2), "hex");
};
