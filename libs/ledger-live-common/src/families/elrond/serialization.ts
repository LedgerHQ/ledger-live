import type { ElrondResourcesRaw, ElrondResources } from "./types";
export function toElrondResourcesRaw(r: ElrondResources): ElrondResourcesRaw {
  const { nonce, delegations } = r;
  return {
    nonce,
    delegations,
  };
}
export function fromElrondResourcesRaw(r: ElrondResourcesRaw): ElrondResources {
  const { nonce, delegations } = r;
  return {
    nonce,
    delegations,
  };
}
