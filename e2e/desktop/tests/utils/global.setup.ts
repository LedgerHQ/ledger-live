import { parseExtraFeatureFlags } from "@ledgerhq/live-e2e-shared/featureFlagsJsonUtils";
import { FullConfig } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { responseLogfilePath } from "./networkResponseLogger";
import { mkdirSync, promises as fs, unlink, writeFileSync } from "fs";
import {
  createNanoAppJsonFile,
  getDeviceFirmwareVersion,
  getSpeculosModel,
} from "@ledgerhq/live-e2e-shared/speculosAppVersion";
import path from "path";
import { NANO_APP_CATALOG_PATH } from "./fileUtils";

const environmentFilePath = "allure-results/environment.properties";

export default async function globalSetup(_config: FullConfig) {
  ensureElectronBinary();
  await cleanupPreviousNanoAppJsonFile();
  if (responseLogfilePath) {
    unlink(responseLogfilePath, error => {
      if (error) {
        console.log("Could not remove response.log file");
      }

      console.log("Previous response.log file removed");
    });
  }
  const SPECULOS_DEVICE = process.env.SPECULOS_DEVICE;
  const SPECULOS_FIRMWARE_VERSION = await getDeviceFirmwareVersion(getSpeculosModel());

  await createNanoAppJsonFile(NANO_APP_CATALOG_PATH);

  const dir = path.dirname(environmentFilePath);

  mkdirSync(dir, { recursive: true });

  writeFileSync(
    environmentFilePath,
    [
      `SPECULOS_DEVICE=${SPECULOS_DEVICE}`,
      `SPECULOS_FIRMWARE_VERSION=${SPECULOS_FIRMWARE_VERSION}`,
      `E2E_DESKTOP_FEATURE_FLAGS=${process.env.E2E_DESKTOP_FEATURE_FLAGS}`,
      `E2E_FEATURE_FLAGS_JSON=${JSON.stringify(parseExtraFeatureFlags(process.env.E2E_FEATURE_FLAGS_JSON))}`,
      "",
    ].join("\n"),
    { encoding: "utf8", flag: "w" },
  );
}

// Electron 42+ downloads its binary on first run rather than at install time; do it once here so parallel workers don't race extracting into dist/.
function ensureElectronBinary() {
  execFileSync(process.execPath, [require.resolve("electron/install.js")], { stdio: "inherit" });
}

async function cleanupPreviousNanoAppJsonFile() {
  const nanoAppJsonPath = path.resolve(process.cwd(), NANO_APP_CATALOG_PATH);
  await fs.unlink(nanoAppJsonPath).catch(() => {});
}
