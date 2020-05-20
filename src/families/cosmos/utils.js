// @flow
import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import { formatCurrencyUnit } from "../../currencies";
import type {
  CosmosDelegation,
  CosmosDelegationInfo,
  CosmosValidatorItem,
  CosmosMappedDelegation,
  CosmosSearchFilter,
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
    invariant(validator, "cosmos: cannot find validator");

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

export const formatDelegationsInfo = (
  delegations: CosmosDelegationInfo[],
  validators: CosmosValidatorItem[]
): {
  validator: ?CosmosValidatorItem,
  address: string,
  amount: BigNumber,
}[] => {
  return delegations.map((d) => ({
    validator: validators.find((v) => v.validatorAddress === d.address),
    address: d.address,
    amount: d.amount,
  }));
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
