import { SolanaResources, SolanaResourcesRaw } from "./types";

export function toSolanaResourcesRaw(
  resources: SolanaResources
): SolanaResourcesRaw {
  return {
    stakes: JSON.stringify(resources.stakes),
  };
}

export function fromSolanaResourcesRaw(
  resourcesRaw: SolanaResourcesRaw
): SolanaResources {
  return {
    stakes: JSON.parse(resourcesRaw.stakes),
  };
}
