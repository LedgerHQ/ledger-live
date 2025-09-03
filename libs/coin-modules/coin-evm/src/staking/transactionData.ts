import type { StakingOperation } from "../types/staking";
import { getStakingContractConfig } from "./config";
import { encodeStakingData } from "./encoder";

export type StakingTransactionType = StakingOperation;

export interface GenerateStakingDataParams {
  recipient: string;
  amount: bigint;
  transactionType: StakingTransactionType;
  currencyId: string;
  sourceValidator?: string;
  delegator?: string;
}

export const buildTransactionParams = (
  currencyId: string,
  transactionType: StakingTransactionType,
  recipient: string,
  amount: bigint,
  sourceValidator?: string,
  delegator?: string,
): unknown[] => {
  if (currencyId === "sei_network_evm") {
    switch (transactionType) {
      case "delegate":
        return [recipient];
      case "undelegate":
        return [recipient, amount];
      case "redelegate":
        if (!sourceValidator) {
          throw new Error("SEI redelegate requires sourceValidator (src validator)");
        }
        return [sourceValidator, recipient, amount];
      case "getStakedBalance":
        if (!delegator || !sourceValidator) {
          throw new Error(
            "SEI getStakedBalance requires delegator (0x...) and validator (seivaloper...)",
          );
        }
        return [delegator, sourceValidator];
      default:
        throw new Error(`Unsupported transaction type for SEI: ${transactionType}`);
    }
  }

  if (currencyId === "celo") {
    switch (transactionType) {
      case "delegate":
      case "undelegate":
        return [recipient, amount];
      case "getStakedBalance":
      case "getUnstakedBalance":
        return [recipient];
      default:
        throw new Error(`Unsupported transaction type for CELO: ${transactionType}`);
    }
  }

  throw new Error(`Unsupported staking currency: ${currencyId}`);
};

export const generateStakingTransactionData = (params: GenerateStakingDataParams): Buffer => {
  const { currencyId, transactionType, recipient, amount, sourceValidator, delegator } = params;

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
    delegator,
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
