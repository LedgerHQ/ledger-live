import { spawnSync } from "node:child_process";
import { platform } from "node:os";
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

  const { APPLEID, APPLEID_PASSWORD, DEVELOPER_TEAM_ID } = process.env;

  if (!APPLEID || !APPLEID_PASSWORD || !DEVELOPER_TEAM_ID) {
    throw new Error(
      "APPLEID and APPLEID_PASSWORD and DEVELOPER_TEAM_ID env variable are required for notarization.",
    );
  }

  async function attemptNotarize(retries, path) {
    try {
      await notarize({
        tool: "notarytool",
        appBundleId: "com.ledger.live",
        appPath: path,
        ascProvider: "EpicDreamSAS",
        appleId: APPLEID,
        teamId: DEVELOPER_TEAM_ID,
        appleIdPassword: APPLEID_PASSWORD,
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
  }
}

export default notarizeApp;
