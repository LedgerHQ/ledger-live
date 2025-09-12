import type { StakeConditions, StakeData, StakeActionCondition } from "../types";

type ConditionCalculator = (stakeData: StakeData) => StakeConditions;

const CONDITION_PROTOCOLS: Record<string, ConditionCalculator> = {
  celo: ({ type, hasPendingVote, canActivate, pendingWithdrawalsCount }) => {
    const activatable = type === "pending" && (canActivate ?? false);
    const revokable = !(type === "active" && hasPendingVote);
    const status = type === "pending" && activatable ? "awaitingActivation" : type;

    return {
      activatable,
      revokable,
      withdrawable: (pendingWithdrawalsCount ?? 0) > 0,
      status,
    };
  },

  sei_network_evm: () => ({
    activatable: false,
    revokable: true,
    withdrawable: true,
    status: "active",
  }),
};

/**
 * Calculate conditions from stake data (generic)
 */
export const calculateStakeConditions = (
  currencyId: string,
  stakeData: StakeData,
): StakeConditions => {
  const calculator = CONDITION_PROTOCOLS[currencyId];
  if (!calculator) {
    throw new Error(`Unsupported currency for conditions: ${currencyId}`);
  }
  return calculator(stakeData);
};

type ActionEvaluator = (conditions: StakeConditions) => StakeActionCondition[];

const ACTION_PROTOCOLS: Record<string, ActionEvaluator> = {
  celo: ({ revokable, withdrawable, status }) => [
    { operation: "delegate", enabled: status !== "pending" },
    {
      operation: "undelegate",
      enabled: !!revokable,
      ...(!revokable && { reason: "Vote must be revokable" }),
    },
    { operation: "lock", enabled: true },
    { operation: "unlock", enabled: true },
    {
      operation: "withdraw",
      enabled: !!withdrawable,
      ...(!withdrawable && { reason: "No pending withdrawals" }),
    },
  ],

  sei_network_evm: () => [
    { operation: "delegate", enabled: true },
    { operation: "undelegate", enabled: true },
    { operation: "redelegate", enabled: true },
  ],
};

/**
 * Evaluate which staking actions are available based on conditions (generic)
 */
export const getAvailableActions = (
  currencyId: string,
  conditions: StakeConditions,
): StakeActionCondition[] => {
  const evaluator = ACTION_PROTOCOLS[currencyId];
  if (!evaluator) {
    throw new Error(`Unsupported currency for actions: ${currencyId}`);
  }
  return evaluator(conditions);
};
