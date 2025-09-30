import { HttpManagerApiRepository, ApplicationV2Entity } from "@ledgerhq/device-core";
import { version } from "@ledgerhq/device-core/package.json";
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
    case CryptoWallet.LNSP.name:
    default:
      return DeviceModelId.nanoSP;
  }
}

export async function getNanoAppCatalog(): Promise<ApplicationV2Entity[]> {
  const repository = new HttpManagerApiRepository(getEnv("MANAGER_API_BASE"), version);
  const speculosModel = getSpeculosModel();
  const modelToTargetIdMap = {
    [DeviceModelId.nanoS]: CryptoWallet.LNS.targetId,
    [DeviceModelId.nanoX]: CryptoWallet.LNX.targetId,
    [DeviceModelId.nanoSP]: CryptoWallet.LNSP.targetId,
  };
  const targetId = modelToTargetIdMap[speculosModel];
  return await repository.catalogForDevice({
    provider: 1,
    targetId: targetId,
    firmwareVersion: process.env.SPECULOS_FIRMWARE_VERSION || "",
  });
}

export async function createNanoAppJsonFile(): Promise<void> {
  try {
    const appCatalog = await getNanoAppCatalog();
    const rootDir = process.cwd();
    const nanoAppFilePath = getEnv("E2E_NANO_APP_VERSION_PATH");
    const jsonFilePath = path.join(rootDir, nanoAppFilePath);
    const dirPath = path.dirname(jsonFilePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    fs.writeFileSync(jsonFilePath, JSON.stringify(appCatalog, null, 2), "utf8");
  } catch (error) {
    console.error("Unable to create app version file:", error);
  }
}

export async function getAppVersionFromCatalog(currency: string): Promise<string | undefined> {
  try {
    await createNanoAppJsonFile();
    const rootDir = process.cwd();
    const nanoAppFilePath = getEnv("E2E_NANO_APP_VERSION_PATH");
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
