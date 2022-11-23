import { BigNumber } from "bignumber.js";
import type { IconResourcesRaw, IconResources } from "./types";

export function toIconResourcesRaw(r: IconResources): IconResourcesRaw {
  const { nonce, additionalBalance, votes, votingPower, totalDelegated } = r;
  return {
    nonce,
    additionalBalance: additionalBalance.toString(),
    votes,
    votingPower: votingPower.toString(),
    totalDelegated: totalDelegated.toString(),
  };
}

export function fromIconResourcesRaw(r: IconResourcesRaw): IconResources {
  const { nonce, additionalBalance, votes, votingPower, totalDelegated } = r;
  return {
    nonce,
    additionalBalance: new BigNumber(additionalBalance),
    votes,
    votingPower: new BigNumber(votingPower || 0),
    totalDelegated: new BigNumber(totalDelegated || 0)
  };
}
