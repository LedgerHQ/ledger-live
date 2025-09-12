import type { StakingOperation } from "../types";

export interface OperationParams {
  recipient?: string;
  amount?: bigint;
  sourceValidator?: string;
  delegator?: string;
  index?: number;
}

type OperationFn = (params: OperationParams) => unknown[];

const STAKING_PROTOCOLS: Record<string, Record<string, OperationFn>> = {
  sei_network_evm: {
    delegate: ({ recipient }) => [recipient],
    undelegate: ({ recipient, amount }) => [recipient, amount],
    redelegate: ({ recipient, amount, sourceValidator }) => {
      if (!sourceValidator) throw new Error("SEI redelegate requires sourceValidator");
      return [sourceValidator, recipient, amount];
    },
    getStakedBalance: ({ sourceValidator, delegator }) => {
      if (!delegator || !sourceValidator) {
        throw new Error("SEI getStakedBalance requires delegator and validator");
      }
      return [delegator, sourceValidator];
    },
  },
  celo: {
    delegate: ({ recipient, amount }) => [recipient, amount],
    undelegate: ({ recipient, amount }) => [recipient, amount],
    redelegate: () => {
      throw new Error("Celo does not support redelegate");
    },
    getStakedBalance: ({ recipient }) => [recipient],
    getUnstakedBalance: ({ recipient }) => [recipient],
    getPendingWithdrawals: ({ recipient }) => [recipient],
    getVoter: ({ recipient }) => [recipient],
    lock: () => [], // lock uses payable value, no parameters needed
    unlock: ({ amount }) => [amount],
    withdraw: ({ index }) => {
      if (index === undefined) throw new Error("Celo withdraw requires index");
      return [index];
    },
  },
};

export const buildTransactionParams = (
  currencyId: string,
  transactionType: StakingOperation,
  params: OperationParams,
): unknown[] => {
  const protocol = STAKING_PROTOCOLS[currencyId];
  if (!protocol) {
    throw new Error(`Unsupported staking currency: ${currencyId}`);
  }

  const operation = protocol[transactionType];
  if (!operation) {
    throw new Error(`Unsupported transaction type for ${currencyId}: ${transactionType}`);
  }

  return operation(params);
};
