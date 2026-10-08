import { DeviceModelId } from "@ledgerhq/types-devices";
import { getNanoAppCatalog, getDeviceFirmwareVersion } from "../speculosAppVersion";
export type MockServerApp = { name: string; version?: string; hash?: string };

/** Catalogs are per target id, firmware and provider, so cache on all three. */
const catalogCache = new Map<string, Promise<Map<string, MockServerApp>>>();

const DEFAULT_CATALOG_PROVIDER = 1;

async function appsByName(
  model: DeviceModelId,
  firmware: string,
  provider: number,
): Promise<Map<string, MockServerApp>> {
  const key = `${model}@${firmware}@${provider}`;

  const cached = catalogCache.get(key);
  if (cached) return cached;

  const pending = getNanoAppCatalog(model, firmware, provider).then(
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
 * An app that already carries a hash is passed through untouched. An explicit version is
 * kept. The hash only marks a real catalog install; the version is what the device reports
 * when the app opens. A pinned build such as Ethereum `1.23.0-dev` has no published hash,
 * so the two belong to different builds on purpose.
 */
export async function withInstallHashes(
  model: DeviceModelId,
  apps: MockServerApp[],
  options?: { firmware?: string; provider?: number },
): Promise<MockServerApp[]> {
  if (apps.every(app => app.hash)) return apps;
  const firmware = options?.firmware || (await getDeviceFirmwareVersion(model));
  const catalog = await appsByName(model, firmware, options?.provider ?? DEFAULT_CATALOG_PROVIDER);

  return apps.map(app => {
    if (app.hash) return app;

    const resolved = catalog.get(app.name);
    if (!resolved?.hash) {
      throw new Error(
        `App "${app.name}" is not in the ${model} catalog. Available: ${[...catalog.keys()].slice(0, 12).join(", ")}…`,
      );
    }
    return { ...resolved, version: app.version ?? resolved.version };
  });
}
