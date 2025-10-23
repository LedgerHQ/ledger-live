import { HttpManagerApiRepository, ApplicationV2Entity } from "@ledgerhq/device-core";
import { version } from "../../package.json";
import { getEnv } from "@ledgerhq/live-env";
import { DeviceModelId } from "@ledgerhq/devices";
import { Device as CryptoWallet } from "./enum/Device";
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
    case CryptoWallet.LNSP.name:
    default:
      return DeviceModelId.nanoSP;
  }
}

export function isTouchDevice(): boolean {
  const model = getSpeculosModel();
  return model === DeviceModelId.stax || model === DeviceModelId.europa;
}

function getDeviceTargetId(device: DeviceModelId): number {
  const modelToTargetIdMap = {
    [DeviceModelId.nanoS]: CryptoWallet.LNS.targetId,
    [DeviceModelId.nanoX]: CryptoWallet.LNX.targetId,
    [DeviceModelId.nanoSP]: CryptoWallet.LNSP.targetId,
    [DeviceModelId.stax]: CryptoWallet.STAX.targetId,
    [DeviceModelId.europa]: CryptoWallet.FLEX.targetId,
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

function getDeviceFirmwareVersion(): string {
  const firmwareVersion = process.env.SPECULOS_FIRMWARE_VERSION;
  if (!firmwareVersion) {
    throw new Error("SPECULOS_FIRMWARE_VERSION environment variable is not set");
  }
  return firmwareVersion;
}

export async function createNanoAppJsonFile(nanoAppFilePath: string): Promise<void> {
  try {
    const device = getSpeculosModel();
    const firmware = getDeviceFirmwareVersion();
    const appCatalog = await getNanoAppCatalog(device, firmware);
    const jsonFilePath = path.join(process.cwd(), nanoAppFilePath);
    const dirPath = path.dirname(jsonFilePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    fs.writeFileSync(jsonFilePath, JSON.stringify(appCatalog, null, 2), "utf8");
  } catch (error) {
    console.error("Unable to create app version file:", error);
  }
}

export async function getAppVersionFromCatalog(
  currency: string,
  nanoAppFilePath: string,
): Promise<string | undefined> {
  try {
    await createNanoAppJsonFile(nanoAppFilePath);
    const rootDir = process.cwd();
    const jsonFilePath = path.join(rootDir, nanoAppFilePath);
    type CatalogApp = { versionDisplayName: string; version: string };
    const raw = fs.readFileSync(jsonFilePath, "utf8");
    const catalog: CatalogApp[] = JSON.parse(raw);

    const app = catalog.find(entry => entry.versionDisplayName === currency);

    return app?.version ?? "";
  } catch (error) {
    console.error(`Unable to get app version for ${currency} from catalog:`, error);
  }
}
