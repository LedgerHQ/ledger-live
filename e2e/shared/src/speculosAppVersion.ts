import { HttpManagerApiRepository, ApplicationV2Entity } from "@ledgerhq/device-core";
import { getEnv } from "@ledgerhq/live-env";
import { DeviceModelId } from "@ledgerhq/devices";
import { Device as CryptoWallet } from "./enum/Device";
import { sanitizeError } from "./index";
import * as fs from "fs";
import * as path from "path";

const liveCommonVersion = "34.64.0"; // live-common version isn't really necessary here, so we can hardcode it
const nanoAppProviderId = 1;

type CatalogApp = { versionDisplayName: string; version: string };

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
): Promise<ApplicationV2Entity[]> {
  const repository = new HttpManagerApiRepository(getEnv("MANAGER_API_BASE"), liveCommonVersion);
  const targetId = getDeviceTargetId(device);
  return await repository.catalogForDevice({
    provider: nanoAppProviderId,
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

  // Latest is chosen by highest numeric ID
  const firmware = providerFirmwares.reduce((latest, current) =>
    current.id > latest.id ? current : latest,
  );

  firmwareVersionCache.set(device, firmware.version);
  process.env.SPECULOS_FIRMWARE_VERSION = firmware.version;

  return firmware.version;
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
    const appCatalog = await getNanoAppCatalog(device, firmware);

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

export async function getNanoAppCatalogVersionMap(
  nanoAppFilePath: string,
): Promise<Map<string, string>> {
  const jsonFilePath = path.resolve(process.cwd(), nanoAppFilePath);

  try {
    await createNanoAppJsonFile(nanoAppFilePath);

    if (!fs.existsSync(jsonFilePath)) {
      console.error(`Catalog file not found: ${jsonFilePath}`);
      return new Map();
    }

    const raw = fs.readFileSync(jsonFilePath, "utf8");
    const catalog: CatalogApp[] = JSON.parse(raw);

    return new Map(catalog.map(entry => [entry.versionDisplayName, entry.version]));
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
    const catalogVersions = await getNanoAppCatalogVersionMap(nanoAppFilePath);
    return catalogVersions.get(currency) ?? "";
  } catch (error) {
    console.error(`Unable to get app version for ${currency} from catalog:`, error);
  }
}
