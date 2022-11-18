import { BigNumber } from "bignumber.js";
import type { IconResourcesRaw, IconResources } from "./types";

export function toIconResourcesRaw(r: IconResources): IconResourcesRaw {
  const { nonce, additionalBalance, votes, votingPower } = r;
  return {
    nonce,
    additionalBalance: additionalBalance.toString(),
    votes,
    votingPower
  };
}

export function fromIconResourcesRaw(r: IconResourcesRaw): IconResources {
  const { nonce, additionalBalance, votes, votingPower } = r;
  return {
    nonce,
    additionalBalance: new BigNumber(additionalBalance),
    votes,
    votingPower
  };
}
