import { register } from "tsconfig-paths";

const tsConfig = require("./tsconfig.json");
register({
  baseUrl: __dirname,
  paths: tsConfig.compilerOptions.paths,
});

import { globalSetup } from "detox/runners/jest";
import { log } from "detox";
import { session as detoxSession } from "detox/internals";
import * as fs from "fs/promises";
import * as path from "path";
import { exec } from "child_process";
import { releaseSpeculosDeviceCI } from "@ledgerhq/live-common/lib/e2e/speculosCI";
import { isSpeculosRemote } from "./helpers/commonHelpers";
import { SPECULOS_TRACKING_FILE } from "./utils/speculosUtils";
import { NANO_APP_CATALOG_PATH } from "./utils/constants";
import { sanitizeError } from "@ledgerhq/live-common/e2e/index";

export default async function setup(): Promise<void> {
  const envFileName = process.env.ENV_FILE || ".env.mock";
  const envFile = path.join(__dirname, "../../apps/ledger-live-mobile", envFileName);
  try {
    await fs.access(envFile, fs.constants.R_OK);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Mock env file not found or not readable: ${envFile} (${errorMessage})`);
  }

  setupSpeculosCleanupHandlers();
  await cleanupPreviousNanoAppJsonFile();

  await globalSetup();

  // Reset retry counter on first run (testSessionIndex=0)
  const testSessionIndex = detoxSession.testSessionIndex ?? 0;
  if (testSessionIndex === 0) {
    const counterPath = path.join(__dirname, ".retry-counter");
    await fs.unlink(counterPath).catch(() => {});
  }
}

async function cleanupAllSpeculos() {
  try {
    const content = await fs.readFile(SPECULOS_TRACKING_FILE, "utf-8").catch(() => null);
    if (!content) return;
    const instances: { deviceId: string }[] = JSON.parse(content);
    if (!instances.length) return;

    log.info(`Cleaning ${instances.length} Speculos instances`);

    await Promise.allSettled(
      instances.map(({ deviceId }) =>
        isSpeculosRemote() ? releaseSpeculosDeviceCI(deviceId) : exec(`docker rm -f ${deviceId}`),
      ),
    );

    await fs.unlink(SPECULOS_TRACKING_FILE).catch(() => {});
  } catch (error) {
    log.error("Speculos cleanup failed:", sanitizeError(error));
  }
}

function setupSpeculosCleanupHandlers() {
  let cleanupInProgress = false;

  const handleCleanup = async (signal: string) => {
    if (cleanupInProgress) return;
    cleanupInProgress = true;

    try {
      await cleanupAllSpeculos();
    } catch (error) {
      log.error(`Cleanup failed (${signal}):`, sanitizeError(error));
    }

    setTimeout(() => process.exit(0), 100);
  };

  const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM", "SIGHUP", "SIGQUIT"];
  signals.forEach(sig => process.once(sig, () => handleCleanup(sig)));
}

async function cleanupPreviousNanoAppJsonFile() {
  const nanoAppJsonPath = path.resolve(process.cwd(), NANO_APP_CATALOG_PATH);
  await fs.unlink(nanoAppJsonPath).catch(() => {});
}
