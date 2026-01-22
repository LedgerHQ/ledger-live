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
import { sanitizeError } from "@ledgerhq/live-common/e2e/index";

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

// Helper to wrap operations with a timeout to prevent CI hangs
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operationName: string,
): Promise<T | undefined> {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<undefined>(resolve => {
    timeoutId = setTimeout(() => {
      log.warn(`${operationName} timed out after ${timeoutMs}ms, continuing...`);
      resolve(undefined);
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (err) {
    clearTimeout(timeoutId!);
    throw err;
  }
}

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
      log.error("Error during CI global teardown:", sanitizeError(err));
    } finally {
      try {
        closeBridge();
        await withTimeout(cleanupDetox(), 30_000, "cleanupDetox");
      } catch (cleanupErr) {
        log.warn("Error during cleanup:", sanitizeError(cleanupErr));
      }
    }
  } else if (process.env.CI) {
    try {
      await fs.unlink(ARTIFACT_ENV_PATH);
    } catch (err) {
      log.warn(`Failed to delete environment.properties:`, sanitizeError(err));
    }
  }

  // default Detox teardown with timeout protection to prevent CI hangs from proper-lockfile issues
  await withTimeout(globalTeardown(), 60_000, "globalTeardown");

  // parallel file cleanups and force close any lingering connections
  await Promise.all([cleanupUserdata(), forceGarbageCollection()]);

  // Write retry counter for next run to detect last retry in jest.config.ts
  await writeRetryCounter();
};

async function writeRetryCounter() {
  try {
    const counterPath = path.join(__dirname, ".retry-counter");
    const currentCount = await fs.readFile(counterPath, "utf-8").catch(() => "0");
    const nextCount = parseInt(currentCount, 10) + 1;
    await fs.writeFile(counterPath, String(nextCount));
  } catch (err) {
    log.warn("Failed to write retry counter:", sanitizeError(err));
  }
}

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
    log.warn("Failed to cleanup temp‑userdata files:", sanitizeError(error));
  }
}
