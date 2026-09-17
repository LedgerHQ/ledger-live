import { DeviceModelId } from "@ledgerhq/types-devices";
import { getNanoAppCatalog, getDeviceFirmwareVersion } from "../speculosAppVersion";
import type { MockServerApp } from "./types";

/** Catalogs are per target id and firmware, so cache on both. */
const catalogCache = new Map<string, Promise<Map<string, MockServerApp>>>();

async function appsByName(model: DeviceModelId): Promise<Map<string, MockServerApp>> {
  const firmware = await getDeviceFirmwareVersion(model);
  const key = `${model}@${firmware}`;

  const cached = catalogCache.get(key);
  if (cached) return cached;

  const pending = getNanoAppCatalog(model, firmware).then(
    catalog =>
      new Map(
        catalog.map(app => [
          app.versionDisplayName,
          { name: app.versionDisplayName, version: app.version, hash: app.hash },
        ]),
      ),
  );
  catalogCache.set(key, pending);
  return pending;
}

/**
 * Resolves apps to seed onto a mocked device, carrying the install hash the manager API
 * publishes for this model and firmware.
 *
 * The hash is what makes an app show up as installed: Ledger Live matches installed apps
 * against the catalog by exact hash, and an app declared without one reads as sideloaded
 * (DSDK-1475). Because the catalog is keyed on target id and firmware, a hash cannot be
 * carried from one model to another — it has to be looked up per device under test.
 */
export async function resolveInstalledApps(
  model: DeviceModelId,
  appNames: string[],
): Promise<MockServerApp[]> {
  if (!appNames.length) return [];
  const catalog = await appsByName(model);

  return appNames.map(name => {
    const app = catalog.get(name);
    if (!app) {
      throw new Error(
        `App "${name}" is not in the ${model} catalog. Available: ${[...catalog.keys()].slice(0, 12).join(", ")}…`,
      );
    }
    return app;
  });
}
