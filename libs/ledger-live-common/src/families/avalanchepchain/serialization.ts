import BigNumber from "bignumber.js";
import type {
  AvalanchePChainResourcesRaw,
  AvalanchePChainResources,
} from "./types";

export function toAvalanchePChainResourcesRaw(
  r: AvalanchePChainResources
): AvalanchePChainResourcesRaw {
  const { publicKey, chainCode, stakedBalance, delegations } = r;

  return {
    publicKey,
    chainCode,
    stakedBalance: stakedBalance.toString(),
    delegations: delegations?.map((delegation) => ({
      txID: delegation.txID,
      startTime: delegation.startTime,
      endTime: delegation.endTime,
      stakeAmount: delegation.stakeAmount.toString(),
      nodeID: delegation.nodeID,
      rewardOwner: delegation.rewardOwner,
      potentialReward: delegation.potentialReward.toString(),
    })),
  };
}

export function fromAvalanchePChainResourcesRaw(
  r: AvalanchePChainResourcesRaw
): AvalanchePChainResources {
  const { publicKey, chainCode, stakedBalance, delegations } = r;

  return {
    publicKey,
    chainCode,
    stakedBalance: new BigNumber(stakedBalance),
    delegations: delegations?.map((delegation) => ({
      txID: delegation.txID,
      startTime: delegation.startTime,
      endTime: delegation.endTime,
      stakeAmount: new BigNumber(delegation.stakeAmount),
      nodeID: delegation.nodeID,
      rewardOwner: delegation.rewardOwner,
      potentialReward: new BigNumber(delegation.potentialReward),
    })),
  };
}
