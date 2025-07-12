import "tsconfig-paths/register";
import { globalSetup } from "detox/runners/jest";
import fs from "fs";
import path from "path";
import { allure } from "jest-allure2-reporter/api";
import { log } from "detox";
import { Subscriber } from "rxjs";

// Cleanup logic
async function cleanupSpeculos() {
  if (global.app?.common?.removeSpeculos) {
    await global.app.common.removeSpeculos();
    log.info("✅ Speculos cleanup completed.");
  }
}

// Handle graceful exits
process.once("SIGINT", async () => {
  log.info("🔴 SIGINT received. Cleaning up...");
  await cleanupSpeculos();
  process.exit(0);
});

process.once("SIGTERM", async () => {
  log.info("🔴 SIGTERM received. Cleaning up...");
  await cleanupSpeculos();
  process.exit(0);
});

process.once("exit", async () => {
  log.info("⚠️ Process exit. Running cleanup...");
  await cleanupSpeculos();
});

process.on("unhandledRejection", reason => {
  const err = reason instanceof Error ? reason : new Error(String(reason));
  logSilentError(err);
});

process.on("uncaughtException", err => {
  logSilentError(err);
});

Subscriber.prototype.error = function (err: Error) {
  logSilentError(err);
};

function logSilentError(err: Error) {
  const errorMessage = `❌ Exception occurred during test → ${err.message}`;
  log.error(errorMessage);
  try {
    allure.description(errorMessage);
    allure.step(err.message, () => {
      allure.status("failed", { message: err.message, trace: err.stack });
    });
  } catch (reportErr) {
    log.error(
      "Failed to report silent error to Allure. ",
      "Original error:",
      err,
      "Reporting error:",
      reportErr,
    );
  }
}

export default async function setup(): Promise<void> {
  // Validate .env.mock file
  const envFileName = process.env.ENV_FILE || ".env.mock";
  const envFile = path.join(__dirname, "../../apps/ledger-live-mobile", envFileName);
  try {
    fs.accessSync(envFile, fs.constants.R_OK);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Mock env file not found or not readable: ${envFile} (${errorMessage})`);
  }

  // Run Detox global setup
  await globalSetup();
}
