import "@shared/env";
import { globalSetup } from "detox/runners/jest";
import { log } from "detox";
import { session as detoxSession, config as detoxConfig } from "detox/internals";
import * as fs from "fs/promises";
import * as path from "path";
import {
  getDeviceFirmwareVersion,
  getSpeculosModel,
} from "@ledgerhq/live-e2e-shared/speculosAppVersion";
import { releaseTrackedSpeculos } from "@e2e/utils/speculosSweep";
import { NANO_APP_CATALOG_PATH } from "@e2e/utils/constants";
import { sanitizeError } from "@ledgerhq/live-e2e-shared/index";
import type { DetoxAllure2AdapterOptions } from "detox-allure2-adapter";

export default async function setup(): Promise<void> {
  const envFileName = process.env.ENV_FILE || ".env.mock";
  const envFile = path.join(__dirname, "../../apps/ledger-live-mobile", envFileName);
  try {
    await fs.access(envFile, fs.constants.R_OK);
  } catch (error) {
    throw Object.assign(new Error(`Mock env file not found or not readable: ${envFile}`), {
      cause: error,
    });
  }

  setupSpeculosCleanupHandlers();
  await cleanupPreviousNanoAppJsonFile();

  // Sets SPECULOS_FIRMWARE_VERSION in the controller so the Allure environment file gets a value.
  try {
    await getDeviceFirmwareVersion(getSpeculosModel());
  } catch (error) {
    log.warn("Failed to resolve Speculos firmware version:", sanitizeError(error));
  }

  await globalSetup();

  const testSessionIndex = detoxSession.testSessionIndex ?? 0;
  const maxRetries = detoxConfig.testRunner?.retries ?? 0;
  const isLastRetry = maxRetries > 0 && testSessionIndex >= maxRetries;

  if (testSessionIndex > 0) {
    // warn, not info: CI runs detox with `--loglevel warn`, which hides info lines.
    log.warn(`[globalSetup] Detox retry: attempt ${testSessionIndex + 1}/${maxRetries + 1}`);
  }

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

function setupSpeculosCleanupHandlers() {
  let cleanupInProgress = false;

  const handleCleanup = async (signal: string) => {
    if (cleanupInProgress) return;
    cleanupInProgress = true;

    try {
      // The run is being aborted, so every worker's instances go, live ones included.
      await releaseTrackedSpeculos({ orphansOnly: false });
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
