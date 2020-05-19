// @flow
import { BigNumber } from "bignumber.js";
import type {
  CosmosDelegation,
  CosmosDelegationInfo,
  CosmosValidatorItem,
  CosmosFormattedDelegation,
} from "./types";

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
