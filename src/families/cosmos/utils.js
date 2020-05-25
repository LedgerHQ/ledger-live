// @flow
import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import { formatCurrencyUnit } from "../../currencies";
import type {
  CosmosDelegation,
  CosmosDelegationInfo,
  CosmosValidatorItem,
  CosmosMappedDelegation,
  CosmosMappedDelegationInfo,
  CosmosSearchFilter,
  CosmosUnbonding,
  CosmosMappedUnbonding,
  CosmosRedelegation,
  CosmosMappedRedelegation,
} from "./types";
import type { Unit } from "../../types";

export function mapDelegations(
  delegations: CosmosDelegation[],
  validators: CosmosValidatorItem[],
  unit: Unit
): CosmosMappedDelegation[] {
  return delegations.map((d) => {
    const rank = validators.findIndex(
      (v) => v.validatorAddress === d.validatorAddress
    );
    const validator = validators[rank];

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
  unbondings: CosmosUnbonding[],
  validators: CosmosValidatorItem[],
  unit: Unit
): CosmosMappedUnbonding[] {
  return unbondings.map((u) => {
    const validator = validators.find(
      (v) => v.validatorAddress === u.validatorAddress
    );

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
  redelegations: CosmosRedelegation[],
  validators: CosmosValidatorItem[],
  unit: Unit
): CosmosMappedRedelegation[] {
  return redelegations.map((r) => {
    const validatorSrc = validators.find(
      (v) => v.validatorAddress === r.validatorSrcAddress
    );

    const validatorDst = validators.find(
      (v) => v.validatorAddress === r.validatorDstAddress
    );

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
  delegations: CosmosDelegationInfo[],
  validators: CosmosValidatorItem[],
  unit: Unit
): CosmosMappedDelegationInfo[] => {
  return delegations.map((d) => {
    const validator = validators.find((v) => v.validatorAddress === d.address);
    invariant(validator, "cosmos: cannot find validator");

    return {
      validator,
      amount: d.amount,
      formattedAmount: formatCurrencyUnit(unit, d.amount, {
        disableRounding: true,
        alwaysShowSign: false,
        showCode: true,
      }),
    };
  });
};

export const MAX_VOTES = 5;

export const formatValue = (value: BigNumber, unit: Unit): number =>
  value
    .dividedBy(10 ** unit.magnitude)
    .integerValue(BigNumber.ROUND_FLOOR)
    .toNumber();

export const searchFilter: CosmosSearchFilter = (query) => ({ validator }) => {
  const terms = `${validator?.name ?? ""} ${validator?.validatorAddress ?? ""}`;
  return terms.toLowerCase().includes(query.toLowerCase().trim());
};
