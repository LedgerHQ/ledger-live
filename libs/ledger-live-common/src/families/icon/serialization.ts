import { BigNumber } from "bignumber.js";
import type { IconResourcesRaw, IconResources } from "./types";

export function toIconResourcesRaw(r: IconResources): IconResourcesRaw {
  const { nonce, additionalBalance, votes, votingPower, totalDelegated } = r;
  return {
    nonce,
    additionalBalance: additionalBalance.toString(),
    votes,
    votingPower,
    totalDelegated,
  };
}

export function fromIconResourcesRaw(r: IconResourcesRaw): IconResources {
  const { nonce, additionalBalance, votes, votingPower, totalDelegated } = r;
  return {
    nonce,
    additionalBalance: new BigNumber(additionalBalance),
    votes,
    votingPower: new BigNumber(votingPower),
    totalDelegated: new BigNumber(totalDelegated)
  };
}
