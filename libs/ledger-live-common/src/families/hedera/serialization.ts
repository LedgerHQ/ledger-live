// @flow

import type { HederaResources, HederaResourcesRaw } from "./types";

export function toHederaResourcesRaw(r: HederaResources): HederaResourcesRaw {
  const { staked } = r;
  return { staked };
}

export function fromHederaResourcesRaw(r: HederaResourcesRaw): HederaResources {
  const { staked } = r;
  return { staked };
}