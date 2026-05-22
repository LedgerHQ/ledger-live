import { device, log } from "detox";
import { promises as fs } from "fs";
import { allure } from "jest-allure2-reporter/api";
import { launchApp, setupEnvironment } from "./helpers/commonHelpers";
import { sanitizeError } from "@ledgerhq/live-common/e2e/index";
import { close as closeBridge } from "./bridge/server";
import { getEnv, setEnv } from "@ledgerhq/live-env";
import { setAllureDescription } from "./helpers/allure/allure-helper";
import {
  endTestCapture,
  isPerTestCaptureEnabled,
  startTestCapture,
} from "./helpers/mitm-test";

const broadcastOriginalValue = getEnv("DISABLE_TRANSACTION_BROADCAST");
setupEnvironment();

beforeAll(
  async () => {
    const port = await launchApp({ newInstance: true });
    await device.reverseTcpPort(8081);
    await device.reverseTcpPort(port);
    await device.reverseTcpPort(52619); // To allow the android emulator to access the dummy app
    setAllureDescription();
  },
  process.env.CI ? 150_000 : 120_000,
);

afterAll(
  async () => {
    setEnv("DISABLE_TRANSACTION_BROADCAST", broadcastOriginalValue);

    if (process.env.CI) {
      try {
        await device.terminateApp();
      } catch (e) {
        log.warn(`setup afterAll terminateApp failed: ${sanitizeError(e)}`);
      }
    }

    try {
      await app.common.removeSpeculos();
    } catch (e) {
      log.warn(`setup afterAll removeSpeculos failed: ${sanitizeError(e)}`);
    }

    try {
      closeBridge();
    } catch (e) {
      log.warn(`setup afterAll closeBridge failed: ${sanitizeError(e)}`);
    }
  },
  process.env.CI ? 60_000 : 30_000,
);

// Per-test mitmproxy capture (opt-in via MITM=1). Each Jest worker has
// its own mitmdump instance (see helpers/mitm.ts) and the addon writes
// one HAR per test on the `end` signal. We then attach it to the
// matching Allure test entry so engineers can open a failing test in
// Allure and inspect exactly that test's network traffic.
//
// All operations are best-effort — a missing/crashed mitmproxy must
// never fail a spec. Failures inside startTestCapture / endTestCapture
// are warnings; the Allure attachment is wrapped in a separate
// try/catch for the same reason.
if (isPerTestCaptureEnabled()) {
  beforeEach(async () => {
    const name = expect.getState().currentTestName ?? "unknown";
    await startTestCapture(name);
  });

  afterEach(async () => {
    const name = expect.getState().currentTestName ?? "unknown";
    const { harPath, flowCount } = await endTestCapture(name);
    if (!harPath || flowCount === 0) return;
    try {
      const content = await fs.readFile(harPath, "utf-8");
      // application/json matches existing attachment conventions in
      // this codebase (utils/speculosUtils.ts, utils/loggingUtils.ts).
      // HAR's official mime type is application/har+json, but allure
      // viewers render generic JSON fine, and jest-allure2-reporter's
      // attachment signature only accepts string content.
      await allure.attachment(`mitm: ${name}`, content, "application/json");
    } catch (e) {
      log.warn(`[mitm-per-test] could not attach HAR for "${name}":`, sanitizeError(e));
    }
  });
}
