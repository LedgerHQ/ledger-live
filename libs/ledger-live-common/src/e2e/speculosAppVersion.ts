import { HttpManagerApiRepository } from "@ledgerhq/device-core";
import { version } from "@ledgerhq/device-core/package.json";
import { getEnv } from "@ledgerhq/live-env";
import { DeviceModelId } from "@ledgerhq/devices";
import { Device as CryptoWallet } from "./enum/Device";
import * as fs from "fs";
import * as path from "path";

function getSpeculosModel(): DeviceModelId {
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

export async function getNanoAppCatalog() {
  const repository = new HttpManagerApiRepository(getEnv("MANAGER_API_BASE"), version);
  const speculosModel = getSpeculosModel();
  const modelToTargetIdMap = {
    [DeviceModelId.nanoS]: CryptoWallet.LNS.targetId,
    [DeviceModelId.nanoX]: CryptoWallet.LNX.targetId,
    [DeviceModelId.nanoSP]: CryptoWallet.LNSP.targetId,
  };
  const targetId = modelToTargetIdMap[speculosModel];
  const catalogForDevices = await repository.catalogForDevice({
    provider: 1,
    targetId: targetId,
    firmwareVersion: process.env.SPECULOS_FIRMWARE_VERSION || "",
  });
  return catalogForDevices;
}

export async function createNanoAppJsonFile() {
  try {
    const appCatalog = await getNanoAppCatalog();
    const rootDir = process.cwd();
    const filePath = rootDir.includes("mobile")
      ? "artifacts/appVersion/nano-app-catalog.json"
      : "tests/artifacts/appVersion/nano-app-catalog.json";
    const jsonFilePath = path.join(rootDir, filePath);
    const dirPath = path.dirname(jsonFilePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    fs.writeFileSync(jsonFilePath, JSON.stringify(appCatalog, null, 2), "utf8");
  } catch (error) {
    console.error("Unable to create app version file:", error);
  }
}

export async function getAppVersionFromCatalog(currency: string) {
  try {
    await createNanoAppJsonFile();
    const rootDir = process.cwd();
    const filepPath = rootDir.includes("mobile")
      ? "artifacts/appVersion/nano-app-catalog.json"
      : "tests/artifacts/appVersion/nano-app-catalog.json";
    const jsonFilePath = path.join(rootDir, filepPath);
    type CatalogApp = { versionDisplayName: string; version: string };
    const raw = fs.readFileSync(jsonFilePath, "utf8");
    const catalog: CatalogApp[] = JSON.parse(raw);

    const app = catalog.find(entry => entry.versionDisplayName === currency);

    return app?.version ?? "";
  } catch (error) {
    console.error(`Unable to get app version for ${currency} from catalog:`, error);
  }
}
