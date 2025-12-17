import { HttpManagerApiRepository, ApplicationV2Entity } from "@ledgerhq/device-core";
import { version } from "../../package.json";
import { getEnv } from "@ledgerhq/live-env";
import { DeviceModelId } from "@ledgerhq/devices";
import { Device as CryptoWallet } from "./enum/Device";
import { sanitizeError } from "./index";
import * as fs from "fs";
import * as path from "path";

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
  const repository = new HttpManagerApiRepository(getEnv("MANAGER_API_BASE"), version);
  const targetId = getDeviceTargetId(device);
  return await repository.catalogForDevice({
    provider: 1,
    targetId: targetId,
    firmwareVersion: deviceFirmware,
  });
}

const firmwareVersionCache: Map<DeviceModelId, string> = new Map();

export async function getDeviceFirmwareVersion(device: DeviceModelId): Promise<string> {
  const cached = firmwareVersionCache.get(device);
  if (cached) return cached;

  const providerId = 1;
  const repository = new HttpManagerApiRepository(getEnv("MANAGER_API_BASE"), version);

  const deviceVersion = await repository.getDeviceVersion({
    targetId: getDeviceTargetId(device),
    providerId,
  });

  const firmwareIds = deviceVersion.se_firmware_final_versions;
  if (!Array.isArray(firmwareIds) || firmwareIds.length === 0) {
    throw new Error(`No firmware versions found for device  ${device}`);
  }

  const firmwares = await Promise.all(firmwareIds.map(id => repository.getFinalFirmwareById(id)));

  // Only firmwares matching providerId
  const providerFirmwares = firmwares.filter(
    fw => Array.isArray(fw.providers) && fw.providers.includes(providerId),
  );

  if (providerFirmwares.length === 0) {
    throw new Error(
      `No firmware versions found for device version ${deviceVersion.id} for device ${device}`,
    );
  }

  // Latest is chosen by highest numeric ID
  const latestFirmware = providerFirmwares.reduce((latest, current) =>
    current.id > latest.id ? current : latest,
  );

  firmwareVersionCache.set(device, latestFirmware.version);
  process.env.SPECULOS_FIRMWARE_VERSION = latestFirmware.version;

  return latestFirmware.version;
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

    fs.writeFileSync(jsonFilePath, JSON.stringify(appCatalog, null, 2), "utf8");
  } catch (error) {
    console.error("Unable to create app version file:", sanitizeError(error));
  }
}

export async function getAppVersionFromCatalog(
  currency: string,
  nanoAppFilePath: string,
): Promise<string | undefined> {
  const jsonFilePath = path.resolve(process.cwd(), nanoAppFilePath);

  try {
    await createNanoAppJsonFile(nanoAppFilePath);

    if (!fs.existsSync(jsonFilePath)) {
      console.error(`Catalog file not found: ${jsonFilePath}`);
      return;
    }

    type CatalogApp = { versionDisplayName: string; version: string };
    const raw = fs.readFileSync(jsonFilePath, "utf8");
    const catalog: CatalogApp[] = JSON.parse(raw);

    const app = catalog.find(entry => entry.versionDisplayName === currency);

    return app?.version ?? "";
  } catch (error) {
    console.error(`Unable to get app version for ${currency} from catalog:`, error);
  }
}
