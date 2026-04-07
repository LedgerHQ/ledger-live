import { formatCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies";
import type { Unit } from "@ledgerhq/types-cryptoassets";
import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import type {
  StakingAccount,
  StakingDelegation,
  StakingDelegationInfo,
  StakingMappedDelegation,
  StakingMappedDelegationInfo,
  StakingMappedRedelegation,
  StakingMappedUnbonding,
  StakingRedelegation,
  StakingSearchFilter,
  StakingUnbonding,
  StakingValidatorItem,
  Transaction,
} from "../types/index";

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
        disableRounding: true,
        alwaysShowSign: false,
        showCode: true,
      }),
      formattedPendingRewards: formatCurrencyUnit(unit, d.pendingRewards, {
        disableRounding: true,
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
        disableRounding: true,
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
        disableRounding: true,
        alwaysShowSign: false,
        showCode: true,
      }),
      validatorSrc,
      validatorDst,
    };
  });
}

export const mapDelegationInfo = (
  delegations: StakingDelegationInfo[],
  validators: StakingValidatorItem[],
  unit: Unit,
  transaction?: Transaction,
): StakingMappedDelegationInfo[] => {
  return delegations.map(d => ({
    ...d,
    validator: validators.find(v => v.validatorAddress === d.address),
    formattedAmount: formatCurrencyUnit(unit, transaction ? transaction.amount : d.amount, {
      disableRounding: true,
      alwaysShowSign: false,
      showCode: true,
    }),
  }));
};

export const formatValue = (value: BigNumber, unit: Unit): number =>
  value
    .dividedBy(10 ** unit.magnitude)
    .integerValue(BigNumber.ROUND_FLOOR)
    .toNumber();

export const searchFilter: StakingSearchFilter =
  query =>
  ({ validator }) => {
    const terms = `${validator?.name ?? ""} ${validator?.validatorAddress ?? ""}`;
    return terms.toLowerCase().includes(query.toLowerCase().trim());
  };

export function getMaxDelegationAvailable(
  account: StakingAccount,
  _validatorsLength: number,
): BigNumber {
  const { spendableBalance } = account;
  return spendableBalance;
}

export const getMaxEstimatedBalance = (a: StakingAccount, estimatedFees: BigNumber): BigNumber => {
  const { stakingResources } = a;
  let blockBalance = new BigNumber(0);

  if (stakingResources) {
    blockBalance = stakingResources.unbondingBalance.plus(stakingResources.delegatedBalance);
  }

  const amount = a.balance.minus(estimatedFees).minus(blockBalance);

  // If the fees are greater than the balance we will have a negative amount
  // so we round it to 0
  if (amount.lt(0)) {
    return new BigNumber(0);
  }

  return amount;
};

export function canUndelegate(account: StakingAccount): boolean {
  const { stakingResources } = account;
  invariant(stakingResources, "stakingResources should exist");
  return !!stakingResources?.unbondings;
}

export function canDelegate(account: StakingAccount): boolean {
  const maxSpendableBalance = account.spendableBalance;
  return maxSpendableBalance.gt(0);
}

export function canRedelegate(
  account: StakingAccount,
  delegation: StakingDelegation | StakingValidatorItem,
): boolean {
  const { stakingResources } = account;
  invariant(stakingResources, "stakingResources should exist");
  return (
    !!stakingResources?.redelegations &&
    !stakingResources.redelegations.some(
      rd => rd.validatorDstAddress === delegation.validatorAddress,
    )
  );
}

export function getRedelegation(
  account: StakingAccount,
  delegation: StakingMappedDelegation,
): StakingRedelegation | null | undefined {
  const { stakingResources } = account;
  const redelegations = stakingResources?.redelegations ?? [];
  const currentRedelegation = redelegations.find(
    r => r.validatorDstAddress === delegation.validatorAddress,
  );
  return currentRedelegation;
}

export function getRedelegationCompletionDate(
  account: StakingAccount,
  delegation: StakingMappedDelegation,
): Date | null | undefined {
  const currentRedelegation = getRedelegation(account, delegation);
  return currentRedelegation ? currentRedelegation.completionDate : null;
}

export function parseAmountStringToNumber(amountString: string, unitCode: string): string {
  return amountString.slice(amountString.lastIndexOf(",") + 1).replace(unitCode, "");
}
