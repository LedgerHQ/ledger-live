import { getEnv, setEnv } from "@shared/env";
import { device, log } from "detox";
import { launchApp, setupEnvironment } from "@e2e/helpers/commonHelpers";
import { sanitizeError } from "@ledgerhq/live-e2e-shared/index";
import { close as closeBridge } from "@e2e/bridge/server";
import { setAllureDescription } from "@e2e/helpers/allure/allure-helper";
import { deleteSpeculos } from "@e2e/utils/speculosUtils";
import {
  EXCLUSIVE_LOCK_ACQUIRE_HOOK_TIMEOUT,
  EXCLUSIVE_LOCK_RELEASE_HOOK_TIMEOUT,
  lockDeclaredTargets,
  releaseDeclaredTargets,
} from "@e2e/helpers/exclusiveLock";

const LAUNCH_TIMEOUT = 150_000;
const TEARDOWN_TIMEOUT = 60_000;

const broadcastOriginalValue = getEnv("DISABLE_TRANSACTION_BROADCAST");
setupEnvironment();

beforeAll(async () => {
  try {
    await lockDeclaredTargets();
  } catch (error) {
    process.env.DISABLE_TRANSACTION_BROADCAST = "1";
    setupEnvironment();
    throw error;
  }
}, EXCLUSIVE_LOCK_ACQUIRE_HOOK_TIMEOUT);

beforeAll(async () => {
  const port = await launchApp({ newInstance: true, delete: true });
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
    await closeBridge();
  } catch (e) {
    log.warn(`setup afterAll closeBridge failed: ${sanitizeError(e)}`);
  }
}, TEARDOWN_TIMEOUT);

afterAll(async () => {
  await releaseDeclaredTargets();
}, EXCLUSIVE_LOCK_RELEASE_HOOK_TIMEOUT);
