import { HeliumResources, HeliumResourcesRaw } from "./types";

export function toHeliumResourcesRaw(
  resources: HeliumResources
): HeliumResourcesRaw {
  return {
    stakes: JSON.stringify(resources.stakes),
  };
}

export function fromHeliumResourcesRaw(
  resourcesRaw: HeliumResourcesRaw
): HeliumResources {
  return {
    stakes: JSON.parse(resourcesRaw.stakes),
  };
}
