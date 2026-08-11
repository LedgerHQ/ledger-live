// Encapsulate for LLD & LLM
import invariant from "invariant";
import { formatCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies";
import type { Unit } from "@ledgerhq/coin-module-framework/api/types";
import { BigNumber } from "bignumber.js";
import type {
  StakingAccount,
  StakingDelegation,
  StakingMappedDelegation,
  StakingMappedRedelegation,
  StakingMappedUnbonding,
  StakingRedelegation,
  StakingUnbonding,
  StakingValidatorItem,
} from "@ledgerhq/types-live";
import { STAKING_CONTRACTS } from "@ledgerhq/coin-evm/staking/index";

export {
  parseAmountStringToNumber,
  decodeRedelegatePayload,
  resolveRedelegationValidators,
  resolveStakingValidator,
  getValidatorExplorerUrl,
  getUnbondingPeriodDays,
  getMaxRedelegations,
  getDelegationVisibilityDelayMinutes,
  hasUnbondingPeriod,
  hasDelegationVisibilityDelay,
  hasRedelegation,
  hasCompound,
  hasChainRewards,
  getValidators,
  prefetchValidators,
  isSeiAccountUnassociated,
} from "@ledgerhq/coin-evm/staking/index";

export function mapDelegations(
  delegations: StakingDelegation[],
  validators: StakingValidatorItem[],
  unit: Unit,
): StakingMappedDelegation[] {
  return delegations.map(d => {
    const rank = validators.findIndex(v => v.validatorAddress === d.validatorAddress);
    const validator = rank === -1 ? undefined : validators[rank];
    return {
      ...d,
      formattedAmount: formatCurrencyUnit(unit, d.amount, {
        disableRounding: false,
        alwaysShowSign: false,
        showCode: true,
      }),
      formattedPendingRewards: formatCurrencyUnit(unit, d.pendingRewards, {
        disableRounding: false,
        alwaysShowSign: false,
        showCode: true,
      }),
      rank,
      validator,
    };
  });
}

export function mapUnbondings(
  unbondings: StakingUnbonding[],
  validators: StakingValidatorItem[],
  unit: Unit,
): StakingMappedUnbonding[] {
  const sortedUnbondings = [...unbondings].sort(
    (a, b) => a.completionDate.valueOf() - b.completionDate.valueOf(),
  );
  return sortedUnbondings.map(u => {
    const validator = validators.find(v => v.validatorAddress === u.validatorAddress);
    return {
      ...u,
      formattedAmount: formatCurrencyUnit(unit, u.amount, {
        disableRounding: false,
        alwaysShowSign: false,
        showCode: true,
      }),
      validator,
    };
  });
}

export function mapRedelegations(
  redelegations: StakingRedelegation[],
  validators: StakingValidatorItem[],
  unit: Unit,
): StakingMappedRedelegation[] {
  return redelegations.map(r => {
    const validatorSrc = validators.find(v => v.validatorAddress === r.validatorSrcAddress);
    const validatorDst = validators.find(v => v.validatorAddress === r.validatorDstAddress);
    return {
      ...r,
      formattedAmount: formatCurrencyUnit(unit, r.amount, {
        disableRounding: false,
        alwaysShowSign: false,
        showCode: true,
      }),
      validatorSrc,
      validatorDst,
    };
  });
}

export function getMaxDelegationAvailable(
  account: StakingAccount,
  _validatorsLength: number,
): BigNumber {
  return account.spendableBalance;
}

export const getMaxEstimatedBalance = (a: StakingAccount, estimatedFees: BigNumber): BigNumber => {
  const amount = a.spendableBalance.minus(estimatedFees);
  if (amount.lt(0)) return new BigNumber(0);
  return amount;
};

export function getRedelegation(
  account: StakingAccount,
  delegation: StakingMappedDelegation,
): StakingRedelegation | null | undefined {
  const redelegations = account.stakingResources?.redelegations ?? [];
  const now = new Date();
  return redelegations.find(
    r => r.validatorDstAddress === delegation.validatorAddress && r.completionDate > now,
  );
}

export function getRedelegationCompletionDate(
  account: StakingAccount,
  delegation: StakingMappedDelegation,
): Date | null | undefined {
  const currentRedelegation = getRedelegation(account, delegation);
  return currentRedelegation ? currentRedelegation.completionDate : null;
}

export function canUndelegate(account: StakingAccount, delegation?: StakingDelegation): boolean {
  invariant(account.stakingResources, "stakingResources should exist");
  if (!delegation) return true;
  if (delegation.status === "activating") return false;
  const chainCanUndelegate = STAKING_CONTRACTS[account.currency.id]?.canUndelegate;
  if (chainCanUndelegate) {
    const shares = BigNumber.isBigNumber(delegation.shares)
      ? BigInt(delegation.shares.toFixed(0))
      : undefined;
    return chainCanUndelegate({ details: { shares } });
  }
  return true;
}

export function canWithdraw(unbonding: Pick<StakingUnbonding, "withdrawId" | "status">): boolean {
  return unbonding.withdrawId !== undefined && unbonding.status === "withdrawable";
}

export function canDelegate(account: StakingAccount): boolean {
  return account.spendableBalance.gt(0);
}

export function canRedelegate(
  account: StakingAccount,
  delegation: StakingDelegation | StakingValidatorItem,
): boolean {
  invariant(account.stakingResources, "stakingResources should exist");
  // The chain must expose a redelegate precompile function; without it the
  // transaction will always fail, so the UI action should be hidden entirely.
  if (!STAKING_CONTRACTS[account.currency.id]?.functions.redelegate) return false;
  const redelegations = account.stakingResources.redelegations ?? [];
  const now = new Date();
  const activeRedelegations = redelegations.filter(rd => rd.completionDate > now);
  const maxRedelegations = STAKING_CONTRACTS[account.currency.id]?.maxRedelegations;
  if (maxRedelegations !== undefined && activeRedelegations.length >= maxRedelegations)
    return false;
  // Cannot redelegate FROM a validator that currently holds an active incoming
  // redelegation (21-day cooldown). Check completionDate explicitly so that
  // stale cached data does not incorrectly block redelegations after the window.
  return !activeRedelegations.some(rd => rd.validatorDstAddress === delegation.validatorAddress);
}

export function canCompound(account: StakingAccount, delegation: StakingDelegation): boolean {
  // The chain must expose a compound precompile function; without it the
  // transaction will always fail, so the UI option should be hidden entirely.
  if (!STAKING_CONTRACTS[account.currency.id]?.functions.compoundReward) return false;
  // Compounding restakes accrued rewards, so it only makes sense when there is
  // something to restake.
  return delegation.pendingRewards.gt(0);
}
