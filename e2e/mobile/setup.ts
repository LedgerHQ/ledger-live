import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { getEnv, setEnv } from "@shared/env";
import { device, log } from "detox";
import { launchApp, setupEnvironment } from "@e2e/helpers/commonHelpers";
import { sanitizeError } from "@ledgerhq/live-e2e-shared/index";
import { close as closeBridge } from "@e2e/bridge/server";
import { setAllureDescription } from "@e2e/helpers/allure/allure-helper";
import { deleteSpeculos } from "@e2e/utils/speculosUtils";

const LAUNCH_TIMEOUT = 150_000;
const TEARDOWN_TIMEOUT = 60_000;

const broadcastOriginalValue = getEnv("DISABLE_TRANSACTION_BROADCAST");
setupEnvironment();

beforeAll(async () => {
  // Study (ios-e2e-no-delete): install once per simulator, then relaunch without reinstalling.
  // Jest copies process.env per spec file, so a marker file (per Jest run and device) carries it.
  const installedMarker = path.join(
    os.tmpdir(),
    `e2e-app-installed-${process.ppid}-${device.id.replace(/\W/g, "_")}`,
  );
  const firstOnDevice = !fs.existsSync(installedMarker);
  const port = await launchApp({ newInstance: true, delete: firstOnDevice });
  fs.writeFileSync(installedMarker, "");
  log.info(`[timing] launchApp delete=${firstOnDevice} device=${device.id}`);
  await device.reverseTcpPort(8081);
  await device.reverseTcpPort(port);
  await device.reverseTcpPort(52619); // To allow the android emulator to access the dummy app
  setAllureDescription();
}, LAUNCH_TIMEOUT);

afterAll(async () => {
  setEnv("DISABLE_TRANSACTION_BROADCAST", broadcastOriginalValue);

  if (process.env.CI) {
    try {
      await device.terminateApp();
    } catch (e) {
      log.warn(`setup afterAll terminateApp failed: ${sanitizeError(e)}`);
    }
  }

  try {
    if (process.env.CI) {
      await deleteSpeculos();
    } else {
      await app.common.removeSpeculos();
    }
  } catch (e) {
    log.warn(`setup afterAll speculos cleanup failed: ${sanitizeError(e)}`);
  }

  try {
    closeBridge();
  } catch (e) {
    log.warn(`setup afterAll closeBridge failed: ${sanitizeError(e)}`);
  }
}, TEARDOWN_TIMEOUT);
