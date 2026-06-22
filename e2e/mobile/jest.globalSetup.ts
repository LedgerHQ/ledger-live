import { globalSetup } from "detox/runners/jest";
import { log } from "detox";
import { session as detoxSession, config as detoxConfig } from "detox/internals";
import * as fs from "fs/promises";
import * as path from "path";
import { exec } from "child_process";
import { releaseSpeculosDeviceCI } from "@ledgerhq/live-common/e2e/speculosCI";
import { isSpeculosRemote } from "./helpers/commonHelpers";
import { ARTIFACTS_DIR, SPECULOS_TRACKING_FILE_PATTERN } from "./utils/speculosUtils";
import { NANO_APP_CATALOG_PATH } from "./utils/constants";
import { sanitizeError } from "@ledgerhq/live-common/e2e/index";
import type { DetoxAllure2AdapterOptions } from "detox-allure2-adapter";

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

  const testSessionIndex = detoxSession.testSessionIndex ?? 0;
  const maxRetries = detoxConfig.testRunner?.retries ?? 0;
  const isLastRetry = maxRetries > 0 && testSessionIndex >= maxRetries;

  const videoOptions: DetoxAllure2AdapterOptions["deviceVideos"] = {
    android: {
      recording: { bitRate: 1_000_000, maxSize: 720, codec: "h264" },
      audio: false,
      window: false,
    },
    ios: { codec: "hevc" },
  };

  if (isLastRetry) {
    // Workers are spawned AFTER globalSetup, so they will inherit this env var
    process.env.DETOX_ENABLE_VIDEO = "true";
    process.env.DETOX_VIDEO_OPTIONS = JSON.stringify(videoOptions);
    log.info(
      `[globalSetup] Last retry detected (attempt ${testSessionIndex + 1}/${maxRetries + 1}), video recording enabled`,
    );
  }
}

async function cleanupAllSpeculos() {
  // Workers each write their own artifacts/speculos-instances.<pid>.json. From the
  // controller (this process) we sweep all of them on shutdown so nothing leaks
  // when workers are killed without running their teardown.
  try {
    const files = await fs.readdir(ARTIFACTS_DIR).catch(() => [] as string[]);
    const trackingFiles = files.filter(f => SPECULOS_TRACKING_FILE_PATTERN.test(f));
    if (!trackingFiles.length) return;

    const allInstances: { deviceId: string; file: string }[] = [];
    const parsedFiles = new Set<string>();
    for (const file of trackingFiles) {
      const fullPath = path.join(ARTIFACTS_DIR, file);
      const content = await fs.readFile(fullPath, "utf-8").catch(() => null);
      if (!content) continue;
      try {
        const parsed: { deviceId: string }[] = JSON.parse(content);
        for (const inst of parsed) allInstances.push({ ...inst, file: fullPath });
        parsedFiles.add(fullPath);
      } catch {
        // ignore malformed tracking file
        log.error(`Malformed Speculos tracking file ${fullPath}. Keeping file for recovery`);
      }
    }

    if (!allInstances.length) return;

    log.info(
      `Cleaning ${allInstances.length} Speculos instances across ${trackingFiles.length} worker file(s)`,
    );

    await Promise.allSettled(
      allInstances.map(({ deviceId }) =>
        isSpeculosRemote() ? releaseSpeculosDeviceCI(deviceId) : exec(`docker rm -f ${deviceId}`),
      ),
    );

    await Promise.all([...parsedFiles].map(fullPath => fs.unlink(fullPath).catch(() => {})));
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
