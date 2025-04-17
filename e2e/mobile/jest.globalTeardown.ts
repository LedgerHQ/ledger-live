import { globalTeardown } from "detox/runners/jest";
import { promises as fs } from "fs";
import { close as closeBridge, getEnvs, getFlags, loadConfig } from "./bridge/server";
import { formatEnvData, formatFlagsData } from "@ledgerhq/live-common/e2e/index";
import { launchApp } from "./helpers/commonHelpers";
import detox from "detox/internals";
import path from "path";
import { glob } from "glob";
import { log } from "detox";

const ARTIFACT_ENV_PATH = path.resolve("artifacts/environment.properties");
const TRACKER_PATH = path.resolve(__dirname, "test-tracker.json");
const USERDATA_DIR = path.resolve(__dirname, "userdata");
const USERDATA_GLOB = path.join(USERDATA_DIR, "temp-userdata-*.json");

const shouldManageDetox = detox.getStatus() === "inactive";

export default async function globalTeardownWrapper() {
  if (process.env.CI) {
    try {
      await initDetox();
      await launchApp();
      await loadConfig("1AccountBTC1AccountETHReadOnlyFalse", true);
      await waitForElementById("settings-icon", 120_000);

      const flagsData = formatFlagsData(JSON.parse(await getFlags()));
      const envsData = formatEnvData(JSON.parse(await getEnvs()));
      await fs.appendFile(ARTIFACT_ENV_PATH, flagsData + envsData);

      closeBridge();
      await cleanupDetox();
    } catch (err) {
      log.error("Error during CI global setup:", err);
      await cleanupDetox();
    }
  }

  // default Detox teardown
  await globalTeardown();

  // parallel file cleanups
  await Promise.all([cleanupTracker(), cleanupUserdata()]);
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
    for (const f of files) {
      await fs.unlink(f);
      log.info(`🧹 removed temp‑userdata file: ${path.basename(f)}`);
    }
  } catch (err) {
    log.warn("🧹 failed to cleanup temp‑userdata files:", err);
  }
}

async function cleanupTracker() {
  try {
    await fs.rm(TRACKER_PATH);
    log.info("🧹 test-tracker.json removed");
  } catch {
    // ignore if it doesn't exist
  }
}
