// @flow

import { BigNumber } from "bignumber.js";
import type { CosmosResourcesRaw, CosmosResources } from "./types";

export function toCosmosResourcesRaw(r: CosmosResources): CosmosResourcesRaw {
  const {
    delegatedBalance,
    delegations,
    pendingRewardsBalance,
    unboundingBalance,
    withdrawAddress
  } = r;
  return {
    delegations: delegations.map(
      ({ amount, status, pendingRewards, validatorAddress }) => ({
        amount: amount.toString(),
        status,
        pendingRewards: pendingRewards.toString(),
        validatorAddress
      })
    ),
    delegatedBalance: delegatedBalance.toString(),
    pendingRewardsBalance: pendingRewardsBalance.toString(),
    unboundingBalance: unboundingBalance.toString(),
    withdrawAddress
  };
}

export function fromCosmosResourcesRaw(r: CosmosResourcesRaw): CosmosResources {
  const {
    delegatedBalance,
    delegations,
    pendingRewardsBalance,
    unboundingBalance,
    withdrawAddress
  } = r;
  return {
    delegations: delegations.map(
      ({ amount, status, pendingRewards, validatorAddress }) => ({
        amount: BigNumber(amount),
        status,
        pendingRewards: BigNumber(pendingRewards),
        validatorAddress
      })
    ),
    delegatedBalance: BigNumber(delegatedBalance),
    pendingRewardsBalance: BigNumber(pendingRewardsBalance),
    unboundingBalance: BigNumber(unboundingBalance),
    withdrawAddress
  };
}
