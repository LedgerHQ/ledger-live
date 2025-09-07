import type { StakingOperation } from "../types/staking";

type OperationFn = (
  recipient: string,
  amount: bigint,
  sourceValidator?: string,
  delegator?: string,
) => unknown[];

const STAKING_PROTOCOLS: Record<string, Record<string, OperationFn>> = {
  sei_network_evm: {
    delegate: recipient => [recipient],
    undelegate: (recipient, amount) => [recipient, amount],
    redelegate: (recipient, amount, sourceValidator) => {
      if (!sourceValidator) throw new Error("SEI redelegate requires sourceValidator");
      return [sourceValidator, recipient, amount];
    },
    getStakedBalance: (_recipient, _amount, sourceValidator, delegator) => {
      if (!delegator || !sourceValidator) {
        throw new Error("SEI getStakedBalance requires delegator and validator");
      }
      return [delegator, sourceValidator];
    },
  },
  celo: {
    delegate: (recipient, amount) => [recipient, amount],
    undelegate: (recipient, amount) => [recipient, amount],
    redelegate: () => {
      throw new Error("Celo does not support redelegate");
    },
    getStakedBalance: recipient => [recipient],
    getUnstakedBalance: recipient => [recipient],
  },
};

export const buildTransactionParams = (
  currencyId: string,
  transactionType: StakingOperation,
  recipient: string,
  amount: bigint,
  sourceValidator?: string,
  delegator?: string,
): unknown[] => {
  const protocol = STAKING_PROTOCOLS[currencyId];
  if (!protocol) {
    throw new Error(`Unsupported staking currency: ${currencyId}`);
  }

  const operation = protocol[transactionType];
  if (!operation) {
    throw new Error(`Unsupported transaction type for ${currencyId}: ${transactionType}`);
  }

  return operation(recipient, amount, sourceValidator, delegator);
};
