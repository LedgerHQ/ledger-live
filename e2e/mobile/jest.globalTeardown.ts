import { register } from "tsconfig-paths";

// Register path mappings explicitly with the correct tsconfig
const tsConfig = require("./tsconfig.json");
register({
  baseUrl: __dirname,
  paths: tsConfig.compilerOptions.paths,
});

import { globalTeardown } from "detox/runners/jest";
import { promises as fs } from "fs";
import { close as closeBridge, getEnvs, getFlags, loadConfig } from "./bridge/server";
import { formatEnvData, formatFlagsData } from "@ledgerhq/live-common/e2e";
import { launchApp } from "./helpers/commonHelpers";
import detox from "detox/internals";
import path from "path";
import { glob } from "glob";
import { log } from "detox";
import { Subject } from "rxjs";
import { NativeElementHelpers } from "./helpers/elementHelpers";

const ARTIFACT_ENV_PATH = path.resolve("artifacts/environment.properties");
const USERDATA_DIR = path.resolve(__dirname, "userdata");
const USERDATA_GLOB = path.join(USERDATA_DIR, "temp-userdata-*.json");

const shouldManageDetox = detox.getStatus() === "inactive";

globalThis.webSocket = {
  wss: undefined,
  ws: undefined,
  messages: {},
  e2eBridgeServer: new Subject(),
};
globalThis.pendingCallbacks = new Map<string, { callback: (data: string) => void }>();

export default async () => {
  if (process.env.CI && process.env.SHARD_INDEX === "1") {
    try {
      await initDetox();
      await launchApp();
      await loadConfig("1AccountBTC1AccountETHReadOnlyFalse", true);
      await NativeElementHelpers.waitForElementById("settings-icon", 120_000);

      const flagsData = formatFlagsData(JSON.parse(await getFlags()));
      const envsData = formatEnvData(JSON.parse(await getEnvs()));
      await fs.appendFile(ARTIFACT_ENV_PATH, flagsData + envsData);
    } catch (err) {
      log.error("Error during CI global teardown:", err);
    } finally {
      try {
        closeBridge();
        await cleanupDetox();
      } catch (cleanupErr) {
        log.warn("Error during cleanup:", cleanupErr);
      }
    }
  } else if (process.env.CI) {
    try {
      await fs.unlink(ARTIFACT_ENV_PATH);
    } catch (err) {
      log.warn(`Failed to delete environment.properties:`, err);
    }
  }

  // default Detox teardown
  await globalTeardown();

  // parallel file cleanups and force close any lingering connections
  await Promise.all([cleanupUserdata(), forceGarbageCollection()]);
};

async function forceGarbageCollection() {
  try {
    global.gc?.();
  } catch {
    // Silent cleanup
  }
}

async function initDetox() {
  if (detox.session.unsafe_earlyTeardown) {
    throw new Error("Detox halted test execution due to an early teardown request");
  }
  const opts = { workerId: `w${process.env.JEST_WORKER_ID}` };
  if (shouldManageDetox) {
    await detox.init(opts);
  } else {
    await detox.installWorker(opts);
  }
  return detox.worker;
}

async function cleanupDetox() {
  if (shouldManageDetox) {
    await detox.cleanup();
  } else {
    await detox.uninstallWorker();
  }
}

async function cleanupUserdata() {
  try {
    const files = await glob(USERDATA_GLOB);
    await Promise.all(files.map(file => fs.unlink(file)));
    log.info(`Cleaned up ${files.length} temp‑userdata files`);
  } catch (error) {
    log.warn("Failed to cleanup temp‑userdata files:", error);
  }
}
