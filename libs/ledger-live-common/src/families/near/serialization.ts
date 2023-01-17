import { BigNumber } from "bignumber.js";
import type { NearResources, NearResourcesRaw } from "./types";

export function toNearResourcesRaw(r: NearResources): NearResourcesRaw {
  const {
    stakedBalance,
    pendingBalance,
    availableBalance,
    storageUsageBalance,
    stakingPositions,
  } = r;
  return {
    stakedBalance: stakedBalance.toString(),
    pendingBalance: pendingBalance.toString(),
    availableBalance: availableBalance.toString(),
    storageUsageBalance: storageUsageBalance.toString(),
    stakingPositions: stakingPositions.map(
      ({ staked, validatorId, available, pending, rewards }) => ({
        staked: staked.toString(),
        available: available.toString(),
        pending: pending.toString(),
        rewards: rewards.toString(),
        validatorId,
      })
    ),
  };
}

export function fromNearResourcesRaw(r: NearResourcesRaw): NearResources {
  const {
    stakedBalance,
    pendingBalance,
    availableBalance,
    storageUsageBalance,
    stakingPositions = [],
  } = r;
  return {
    stakedBalance: new BigNumber(stakedBalance),
    pendingBalance: new BigNumber(pendingBalance),
    availableBalance: new BigNumber(availableBalance),
    storageUsageBalance: new BigNumber(storageUsageBalance),
    stakingPositions: stakingPositions.map(
      ({ staked, validatorId, available, pending, rewards }) => ({
        staked: new BigNumber(staked),
        available: new BigNumber(available),
        pending: new BigNumber(pending),
        rewards: new BigNumber(rewards),
        validatorId,
      })
    ),
  };
}
