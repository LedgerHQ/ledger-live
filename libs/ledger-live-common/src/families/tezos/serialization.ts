// @flow
import type { TezosResources, TezosResourcesRaw } from "./types";

export function toTezosResourcesRaw(r: TezosResources): TezosResourcesRaw {
  const { revealed, counter } = r;
  return { revealed, counter };
}

export function fromTezosResourcesRaw(r: TezosResourcesRaw): TezosResources {
  const { revealed, counter } = r;
  return { revealed, counter };
}
