import { device, log } from "detox";
import { launchApp, setupEnvironment } from "./helpers/commonHelpers";
import { sanitizeError } from "@ledgerhq/live-common/e2e/index";
import { close as closeBridge } from "./bridge/server";
import { getEnv, setEnv } from "@ledgerhq/live-env";
import { setAllureDescription } from "./helpers/allure/allure-helper";

const broadcastOriginalValue = getEnv("DISABLE_TRANSACTION_BROADCAST");
setupEnvironment();

beforeAll(
  async () => {
    const port = await launchApp();
    await device.reverseTcpPort(8081);
    await device.reverseTcpPort(port);
    await device.reverseTcpPort(52619); // To allow the android emulator to access the dummy app
    setAllureDescription();
  },
  process.env.CI ? 150_000 : 120_000,
);

afterAll(
  async () => {
    if (process.env.CI) {
      try {
        // Workaround (QAA-1318): open modular drawer blocks the portfolio deeplink
        await app.modularDrawer.tapDrawerCloseButton({ onlyIfVisible: true });
        await app.portfolio.openViaDeeplink(5_000);
        await device.terminateApp();
      } catch (e) {
        log.warn(`setup afterAll terminateApp failed: ${sanitizeError(e)}`);
      }
    }

    setEnv("DISABLE_TRANSACTION_BROADCAST", broadcastOriginalValue);
    closeBridge();
    try {
      await app.common.removeSpeculos();
    } catch (e) {
      log.warn(`setup afterAll removeSpeculos failed: ${sanitizeError(e)}`);
    }
  },
  process.env.CI ? 60_000 : 30_000,
);
