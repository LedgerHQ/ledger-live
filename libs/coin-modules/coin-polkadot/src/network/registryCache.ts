import { log } from "@ledgerhq/logs";
import { getRegistryStorage } from "../config";
import type { SidecarTransactionMaterial, SidecarRuntimeSpec } from "./types";

type CachedRegistryData = {
  material: SidecarTransactionMaterial;
  spec: SidecarRuntimeSpec;
  specVersion: string;
  cachedAt: number;
};

function cacheKey(currencyId: string): string {
  return `polkadot_registry_${currencyId}`;
}

export async function tryLoadFromDisk(
  currencyId: string,
  currentSpecVersion: string,
): Promise<{ material: SidecarTransactionMaterial; spec: SidecarRuntimeSpec } | null> {
  const storage = getRegistryStorage();
  if (!storage) return null;

  try {
    const raw = await storage.get(cacheKey(currencyId));
    if (!raw) return null;

    const cached: CachedRegistryData = JSON.parse(raw);
    if (cached.specVersion !== currentSpecVersion) {
      log(
        "polkadot/registryCache",
        `specVersion mismatch: cached=${cached.specVersion} current=${currentSpecVersion}`,
      );
      return null;
    }

    return { material: cached.material, spec: cached.spec };
  } catch (e) {
    log("polkadot/registryCache", `disk cache read error: ${e}`);
    return null;
  }
}

export async function persistToDisk(
  currencyId: string,
  material: SidecarTransactionMaterial,
  spec: SidecarRuntimeSpec,
): Promise<void> {
  const storage = getRegistryStorage();
  if (!storage) return;

  try {
    const data: CachedRegistryData = {
      material,
      spec,
      specVersion: material.specVersion,
      cachedAt: Date.now(),
    };
    await storage.set(cacheKey(currencyId), JSON.stringify(data));
  } catch (e) {
    log("polkadot/registryCache", `disk cache write error: ${e}`);
  }
}
