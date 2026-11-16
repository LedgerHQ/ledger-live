import { HttpManagerApiRepository, ApplicationV2Entity } from "@ledgerhq/device-core";
import { getEnv } from "@shared/env";
import { DeviceModelId } from "@ledgerhq/devices";
import { Device as CryptoWallet } from "./enum/Device";
import { sanitizeError } from "./index";
import * as fs from "fs";
import * as path from "path";

const liveCommonVersion = "34.64.0"; // live-common version isn't really necessary here, so we can hardcode it
const nanoAppProviderId = 1;
const BASELINE_CATALOG_APP = "Bitcoin";

export type CatalogApp = { versionDisplayName: string; version: string; provider?: number };

/**
 * Provider whose app builds take precedence over provider 1, e.g. 4 for pre-release apps.
 * Firmware and apps it does not publish still come from provider 1.
 */
export function getNanoAppProvider(): number {
  const provider = Number.parseInt(process.env.SPECULOS_APP_PROVIDER ?? "", 10);
  return Number.isNaN(provider) ? nanoAppProviderId : provider;
}

export function getSpeculosModel(): DeviceModelId {
  const speculosDevice = process.env.SPECULOS_DEVICE;
  switch (speculosDevice) {
    case CryptoWallet.LNS.name:
      return DeviceModelId.nanoS;
    case CryptoWallet.LNX.name:
      return DeviceModelId.nanoX;
    case CryptoWallet.STAX.name:
      return DeviceModelId.stax;
    case CryptoWallet.FLEX.name:
    case DeviceModelId.europa:
      return DeviceModelId.europa;
    case CryptoWallet.NANO_GEN_5.name:
      return DeviceModelId.apex;
    case CryptoWallet.LNSP.name:
    default:
      return DeviceModelId.nanoSP;
  }
}

export function isTouchDevice(): boolean {
  const model = getSpeculosModel();
  return (
    model === DeviceModelId.stax || model === DeviceModelId.europa || model === DeviceModelId.apex
  );
}

function getDeviceTargetId(device: DeviceModelId): number {
  const modelToTargetIdMap = {
    [DeviceModelId.nanoS]: CryptoWallet.LNS.targetId,
    [DeviceModelId.nanoX]: CryptoWallet.LNX.targetId,
    [DeviceModelId.nanoSP]: CryptoWallet.LNSP.targetId,
    [DeviceModelId.stax]: CryptoWallet.STAX.targetId,
    [DeviceModelId.europa]: CryptoWallet.FLEX.targetId,
    [DeviceModelId.apex]: CryptoWallet.NANO_GEN_5.targetId,
  };
  return modelToTargetIdMap[device];
}

export async function getNanoAppCatalog(
  device: DeviceModelId,
  deviceFirmware: string,
  provider = nanoAppProviderId,
): Promise<ApplicationV2Entity[]> {
  const repository = new HttpManagerApiRepository(getEnv("MANAGER_API_BASE"), liveCommonVersion);
  const targetId = getDeviceTargetId(device);
  return await repository.catalogForDevice({
    provider,
    targetId: targetId,
    firmwareVersion: deviceFirmware,
  });
}

const firmwareVersionCache: Map<DeviceModelId, string> = new Map();

export async function getDeviceFirmwareVersion(device: DeviceModelId): Promise<string> {
  const configuredFirmwareVersion = process.env.SPECULOS_FIRMWARE_VERSION;
  if (configuredFirmwareVersion) {
    firmwareVersionCache.set(device, configuredFirmwareVersion);
    return configuredFirmwareVersion;
  }

  const cached = firmwareVersionCache.get(device);
  if (cached) return cached;

  const repository = new HttpManagerApiRepository(getEnv("MANAGER_API_BASE"), liveCommonVersion);
  const { firmwares } = await newestProviderFirmwares(repository, device);

  // Highest id is not always bootable. A new OS can land on provider 1 before its app
  // catalog does (Nano S Plus 1.7.0 shipped with only Solana), and this runs from desktop
  // global setup, so every Speculos test would otherwise start on that catalog.
  const firmware = await latestFirmwareWithBaselineApp(device, firmwares);

  firmwareVersionCache.set(device, firmware);
  process.env.SPECULOS_FIRMWARE_VERSION = firmware;

  return firmware;
}

/**
 * The newest provider OS the Manager API still offers an update from, so n-1 once the latest
 * is published. Each version is looked up by name, as Ledger Wallet looks up the connected
 * device, so a device booted on it is offered that update.
 */
export async function getPreviousFirmwareVersion(
  device: DeviceModelId,
  userId: string,
): Promise<string> {
  const repository = new HttpManagerApiRepository(getEnv("MANAGER_API_BASE"), liveCommonVersion);
  const { deviceVersionId, firmwares } = await newestProviderFirmwares(repository, device);

  for (const { version } of firmwares) {
    const current = await repository.getCurrentFirmware({
      version,
      deviceId: deviceVersionId,
      providerId: nanoAppProviderId,
    });
    const update = await repository.fetchLatestFirmware({
      current_se_firmware_final_version: current.id,
      device_version: deviceVersionId,
      providerId: nanoAppProviderId,
      userId,
    });
    if (update) return version;
  }

  throw new Error(
    `No provider ${nanoAppProviderId} firmware for ${device} is offered an OS update`,
  );
}

async function newestProviderFirmwares(
  repository: HttpManagerApiRepository,
  device: DeviceModelId,
) {
  const deviceVersion = await repository.getDeviceVersion({
    targetId: getDeviceTargetId(device),
    providerId: nanoAppProviderId,
  });

  const firmwareIds = deviceVersion.se_firmware_final_versions;
  if (!Array.isArray(firmwareIds) || firmwareIds.length === 0) {
    throw new Error(`No firmware versions found for device  ${device}`);
  }

  const firmwares = await Promise.all(firmwareIds.map(id => repository.getFinalFirmwareById(id)));

  // Only firmwares matching providerId
  const providerFirmwares = firmwares.filter(
    fw => Array.isArray(fw.providers) && fw.providers.includes(nanoAppProviderId),
  );

  if (providerFirmwares.length === 0) {
    throw new Error(
      `No firmware versions found for device version ${deviceVersion.id} for device ${device}`,
    );
  }

  return {
    deviceVersionId: deviceVersion.id,
    firmwares: providerFirmwares.sort((left, right) => right.id - left.id),
  };
}

async function latestFirmwareWithBaselineApp(
  device: DeviceModelId,
  newestFirst: readonly { id: number; version: string }[],
): Promise<string> {
  for (const firmware of newestFirst) {
    const catalog = await getNanoAppCatalog(device, firmware.version);
    const publishesBaseline = catalog.some(app => app.versionDisplayName === BASELINE_CATALOG_APP);
    if (publishesBaseline) return firmware.version;

    console.warn(
      `Skipping firmware ${firmware.version} for ${device}: provider ${nanoAppProviderId} catalog has no ${BASELINE_CATALOG_APP} app`,
    );
  }

  throw new Error(
    `No provider ${nanoAppProviderId} firmware for ${device} publishes a ${BASELINE_CATALOG_APP} app`,
  );
}

/** The provider 1 catalog, with every app {@link getNanoAppProvider} publishes swapped for its build. */
async function getProviderAppCatalog(
  device: DeviceModelId,
  firmware: string,
): Promise<(ApplicationV2Entity & { provider: number })[]> {
  const baseline = await getNanoAppCatalog(device, firmware);
  const byName = new Map(
    baseline.map(app => [app.versionDisplayName, { ...app, provider: nanoAppProviderId }]),
  );

  const provider = getNanoAppProvider();
  if (provider !== nanoAppProviderId) {
    for (const app of await getNanoAppCatalog(device, firmware, provider)) {
      byName.set(app.versionDisplayName, { ...app, provider });
    }
  }

  return [...byName.values()];
}

export async function createNanoAppJsonFile(nanoAppFilePath: string): Promise<void> {
  const jsonFilePath = path.resolve(process.cwd(), nanoAppFilePath);

  try {
    if (fs.existsSync(jsonFilePath)) {
      return; // File already exists
    }

    fs.mkdirSync(path.dirname(jsonFilePath), { recursive: true });

    const device = getSpeculosModel();
    const firmware = await getDeviceFirmwareVersion(device);
    const appCatalog = await getProviderAppCatalog(device, firmware);

    const tmpPath = `${jsonFilePath}.${process.pid}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(appCatalog, null, 2), "utf8");
    try {
      fs.renameSync(tmpPath, jsonFilePath);
    } catch {
      try {
        fs.unlinkSync(tmpPath);
      } catch {
        // ignore
      }
    }
  } catch (error) {
    console.error("Unable to create app version file:", sanitizeError(error));
  }
}

export async function getNanoAppCatalogMap(
  nanoAppFilePath: string,
): Promise<Map<string, CatalogApp>> {
  const jsonFilePath = path.resolve(process.cwd(), nanoAppFilePath);

  try {
    await createNanoAppJsonFile(nanoAppFilePath);

    if (!fs.existsSync(jsonFilePath)) {
      console.error(`Catalog file not found: ${jsonFilePath}`);
      return new Map();
    }

    const raw = fs.readFileSync(jsonFilePath, "utf8");
    const catalog: CatalogApp[] = JSON.parse(raw);

    return new Map(catalog.map(entry => [entry.versionDisplayName, entry]));
  } catch (error) {
    console.error("Unable to get app versions from catalog:", error);
  }

  return new Map();
}

export async function getAppVersionFromCatalog(
  currency: string,
  nanoAppFilePath: string,
): Promise<string | undefined> {
  try {
    const catalog = await getNanoAppCatalogMap(nanoAppFilePath);
    return catalog.get(currency)?.version ?? "";
  } catch (error) {
    console.error(`Unable to get app version for ${currency} from catalog:`, error);
  }
}
