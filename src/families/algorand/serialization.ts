import { BigNumber } from "bignumber.js";
import type { AlgorandResourcesRaw, AlgorandResources } from "./types";
export function toAlgorandResourcesRaw(
  r: AlgorandResources
): AlgorandResourcesRaw {
  const { rewards, nbAssets } = r;
  return {
    rewards: rewards.toString(),
    nbAssets,
  };
}
export function fromAlgorandResourcesRaw(
  r: AlgorandResourcesRaw
): AlgorandResources {
  const { rewards, nbAssets } = r;
  return {
    rewards: new BigNumber(rewards),
    nbAssets,
  };
}
