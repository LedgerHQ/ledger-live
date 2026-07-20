import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir, platform } from "node:os";
import { join } from "node:path";
import { notarize } from "@electron/notarize";
import chalk from "chalk";
import dotenv from "dotenv";
import debug from "debug";

dotenv.config();
debug.enable("@electron/notarize");

const info = str => {
  console.log(chalk.blue(str));
};

async function notarizeApp(context) {
  if (platform() !== "darwin") {
    info("OS is not mac, skipping notarization.");
    return;
  }

  // Skip notarization in CI or when explicitly disabled
  if (process.env.SKIP_SIGNING === "true") {
    info("Notarization skipped (SKIP_SIGNING=true)");
    return;
  }

  info(
    "Don't mind electron-builder error 'Cannot find module 'scripts/notarize.js', it definitively found me",
  );

  const { APPLECONNECT_API_KEY_ID, APPLECONNECT_API_ISSUER_ID, APPLECONNECT_API_KEY_CONTENT } =
    process.env;

  if (!APPLECONNECT_API_KEY_ID || !APPLECONNECT_API_ISSUER_ID || !APPLECONNECT_API_KEY_CONTENT) {
    throw new Error(
      "APPLECONNECT_API_KEY_ID, APPLECONNECT_API_ISSUER_ID and APPLECONNECT_API_KEY_CONTENT env variables are required for notarization.",
    );
  }

  // notarytool authenticates with an App Store Connect API key. @electron/notarize
  // expects appleApiKey to be a path to the .p8 file, so decode the base64 secret
  // (stored the same way fastlane consumes it) into a temp file for the duration.
  const keyDir = mkdtempSync(join(tmpdir(), "asc-api-key-"));
  const keyPath = join(keyDir, `AuthKey_${APPLECONNECT_API_KEY_ID}.p8`);
  writeFileSync(keyPath, Buffer.from(APPLECONNECT_API_KEY_CONTENT, "base64"));

  async function attemptNotarize(retries, path) {
    try {
      await notarize({
        appBundleId: "com.ledger.live",
        appPath: path,
        appleApiKey: keyPath,
        appleApiKeyId: APPLECONNECT_API_KEY_ID,
        appleApiIssuer: APPLECONNECT_API_ISSUER_ID,
      });
    } catch (e) {
      if (retries > 0) {
        console.warn("RETRYING: ATTEMPTS LEFT " + retries);
        console.error(e?.message);
        await attemptNotarize(retries - 1, path);
      } else {
        throw e;
      }
    }
  }

  const { appOutDir } = context;
  const appName = context.packager.appInfo.productFilename;
  const path = `${appOutDir}/${appName}.app`;

  try {
    await attemptNotarize(3, path);
  } catch (error) {
    if (error.message?.includes("Failed to staple")) {
      console.warn("LAST TRY: STAPLING MANUALLY");
      const res = spawnSync(`xcrun`, ["stapler", "staple", path]);
      console.warn("LAST TRY RESPONSE: " + JSON.stringify(res));
      if (res.status === 65) throw new Error(res.stderr);
    } else {
      throw error;
    }
  } finally {
    rmSync(keyDir, { recursive: true, force: true });
  }
}

export default notarizeApp;
