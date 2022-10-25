import { BigNumber } from "bignumber.js";
import type { IconResourcesRaw, IconResources } from "./types";

export function toIconResourcesRaw(r: IconResources): IconResourcesRaw {
  const { nonce, additionalBalance } = r;
  return {
    nonce,
    additionalBalance: additionalBalance.toString(),
  };
}

export function fromIconResourcesRaw(r: IconResourcesRaw): IconResources {
  const { nonce, additionalBalance } = r;
  return {
    nonce,
    additionalBalance: new BigNumber(additionalBalance),
  };
}
