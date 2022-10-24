import type { ElrondResourcesRaw, ElrondResources } from "./types";
export function toElrondResourcesRaw(r: ElrondResources): ElrondResourcesRaw {
  const { nonce, delegations, providers } = r;
  return {
    nonce,
    delegations,
    providers,
  };
}
export function fromElrondResourcesRaw(r: ElrondResourcesRaw): ElrondResources {
  const { nonce, delegations, providers } = r;
  return {
    nonce,
    delegations,
    providers,
  };
}
