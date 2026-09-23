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
 * Fills in the install hash of every app that does not pin one, reading it from the
 * manager API for this model and firmware. An app declared without a hash reads as
 * sideloaded and is never reported as installed (DSDK-1475), and the catalog is keyed on
 * target id and firmware, so a hash cannot be carried from one model to another.
 *
 * An app that already carries a hash is passed through untouched.
 */
export async function withInstallHashes(
  model: DeviceModelId,
  apps: MockServerApp[],
): Promise<MockServerApp[]> {
  if (apps.every(app => app.hash)) return apps;
  const catalog = await appsByName(model);

  return apps.map(app => {
    if (app.hash) return app;

    const resolved = catalog.get(app.name);
    if (!resolved) {
      throw new Error(
        `App "${app.name}" is not in the ${model} catalog. Available: ${[...catalog.keys()].slice(0, 12).join(", ")}…`,
      );
    }
    return resolved;
  });
}
