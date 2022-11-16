import { BigNumber } from "bignumber.js";
import type { IconResourcesRaw, IconResources } from "./types";

export function toIconResourcesRaw(r: IconResources): IconResourcesRaw {
  const { nonce, additionalBalance, votes } = r;
  return {
    nonce,
    additionalBalance: additionalBalance.toString(),
    votes
  };
}

export function fromIconResourcesRaw(r: IconResourcesRaw): IconResources {
  const { nonce, additionalBalance, votes } = r;
  return {
    nonce,
    additionalBalance: new BigNumber(additionalBalance),
    votes
  };
}
