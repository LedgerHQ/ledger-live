// @flow
import { BigNumber } from "bignumber.js";
import type {
  CosmosDelegation,
  CosmosDelegationInfo,
  CosmosValidatorItem,
  CosmosFormattedDelegation,
  CosmosValidatorSearchFilter,
  CosmosDelegationSearchFilter,
} from "./types";
import type { Unit } from "../../types";

export function formatDelegations(
  delegations: CosmosDelegation[],
  validators: CosmosValidatorItem[]
): CosmosFormattedDelegation[] {
  return delegations.map((d) => ({
    validator: validators.find(
      (v) => v.validatorAddress === d.validatorAddress
    ),
    address: d.validatorAddress,
    amount: d.amount,
    pendingRewards: d.pendingRewards,
    status: d.status,
  }));
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

/** Search filters for validator list */
export const validatorSearchFilter: CosmosValidatorSearchFilter = (query) => ({
  name,
  address,
}) => {
  const terms = `${name || ""} ${address}`;
  return terms.toLowerCase().includes(query.toLowerCase().trim());
};

export const delegationSearchFilter: CosmosDelegationSearchFilter = (
  query
) => ({ validator, address }) => {
  const terms = `${validator?.name ?? ""} ${address}`;
  return terms.toLowerCase().includes(query.toLowerCase().trim());
};
