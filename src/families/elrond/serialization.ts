import type { ElrondResourcesRaw, ElrondResources } from "./types";
export function toElrondResourcesRaw(r: ElrondResources): ElrondResourcesRaw {
  const { nonce } = r;
  return {
    nonce,
  };
}
export function fromElrondResourcesRaw(r: ElrondResourcesRaw): ElrondResources {
  const { nonce } = r;
  return {
    nonce,
  };
}
