import { globalTeardown } from "detox/runners/jest";
import { promises as fs } from "fs";
import {
  close as closeBridge,
  getEnvs,
  getFlags,
  loadConfig,
  setFeatureFlags,
} from "@e2e/bridge/server";
import { formatEnvData, formatFlagsData } from "@ledgerhq/live-e2e-shared";
import { launchApp } from "@e2e/helpers/commonHelpers";
import { getMergedFeatureFlags } from "@e2e/utils/featureFlagUtils";
import detox from "detox/internals";
import path from "path";
import { glob } from "glob";
import { log } from "detox";
import { Subject } from "rxjs";
import { NativeElementHelpers } from "@e2e/helpers/elementHelpers";
import { sanitizeError } from "@ledgerhq/live-e2e-shared/index";
import { withTimeout } from "@e2e/utils/withTimeout";

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
      await launchApp({ newInstance: true });
      await setFeatureFlags(getMergedFeatureFlags());
      await loadConfig("1AccountBTC1AccountETHReadOnlyFalse", true);
      await NativeElementHelpers.waitForElementById("topbar-discover", 120_000);
    } catch (err) {
      log.warn("Error starting the app in CI global teardown:", sanitizeError(err));
    }
    try {
      const flagsData = formatFlagsData(JSON.parse(await getFlags()));
      const envsData = formatEnvData(JSON.parse(await getEnvs()));
      await fs.appendFile(ARTIFACT_ENV_PATH, flagsData + envsData);
    } catch (err) {
      log.warn("Error collecting env data for report in CI global teardown:", sanitizeError(err));
    }
    try {
      closeBridge();
      await withTimeout(cleanupDetox(), 30_000, "cleanupDetox");
    } catch (cleanupErr) {
      log.warn("Error during cleanup in CI global teardown:", sanitizeError(cleanupErr));
    }
  } else if (process.env.CI) {
    try {
      await fs.unlink(ARTIFACT_ENV_PATH);
    } catch (err) {
      log.warn(`Failed to delete environment.properties:`, sanitizeError(err));
    }
  }

  // default Detox teardown with timeout protection to prevent CI hangs from proper-lockfile issues.
  // Surface real failures (orphaned simulators, broken cleanup) instead of swallowing them.
  await withTimeout(globalTeardown(), 60_000, "globalTeardown", { rethrow: true });

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
    log.warn("Failed to cleanup temp‑userdata files:", sanitizeError(error));
  }
}
