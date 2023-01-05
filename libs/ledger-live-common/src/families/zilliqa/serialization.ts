import type { ZilliqaResourcesRaw, ZilliqaResources } from "./types";

export function toZilliqaResourcesRaw(
  r: ZilliqaResources
): ZilliqaResourcesRaw {
  const { nonce, publicKey } = r;
  return {
    nonce,
    publicKey,
  };
}

export function fromZilliqaResourcesRaw(
  r: ZilliqaResourcesRaw
): ZilliqaResources {
  const { nonce, publicKey } = r;
  return {
    nonce,
    publicKey,
  };
}
