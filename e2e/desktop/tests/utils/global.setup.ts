import { FullConfig } from "@playwright/test";
import { responseLogfilePath } from "./networkResponseLogger";
import { mkdirSync, unlink, writeFileSync } from "fs";
import {
  getDeviceFirmwareVersion,
  getSpeculosModel,
} from "@ledgerhq/live-common/e2e/speculosAppVersion";
import path from "path";
import { promises as fs } from "fs";
import { NANO_APP_CATALOG_PATH } from "./fileUtils";

const environmentFilePath = "allure-results/environment.properties";

export default async function globalSetup(_config: FullConfig) {
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

  const dir = path.dirname(environmentFilePath);

  mkdirSync(dir, { recursive: true });

  writeFileSync(
    environmentFilePath,
    [
      `SPECULOS_DEVICE=${SPECULOS_DEVICE}`,
      `SPECULOS_FIRMWARE_VERSION=${SPECULOS_FIRMWARE_VERSION}`,
      "",
    ].join("\n"),
    { encoding: "utf8", flag: "w" },
  );
}

async function cleanupPreviousNanoAppJsonFile() {
  const nanoAppJsonPath = path.resolve(process.cwd(), NANO_APP_CATALOG_PATH);
  await fs.unlink(nanoAppJsonPath).catch(() => {});
}
