// Encapsulate for LLD & LLM
export {
  mapDelegations,
  mapUnbondings,
  mapRedelegations,
  getMaxDelegationAvailable,
  getMaxEstimatedBalance,
  canUndelegate,
  canDelegate,
  canRedelegate,
  getRedelegation,
  getRedelegationCompletionDate,
  parseAmountStringToNumber,
  getValidatorExplorerUrl,
  getUnbondingPeriodDays,
  hasUnbondingPeriod,
} from "@ledgerhq/coin-evm/staking/index";
