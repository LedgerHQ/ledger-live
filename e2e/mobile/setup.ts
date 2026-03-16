import { device } from "detox";
import { close as closeBridge } from "./bridge/server";
import { launchApp, setupEnvironment } from "./helpers/commonHelpers";
import { setAllureDescription } from "./helpers/allure/allure-helper";
import { getEnv, setEnv } from "@ledgerhq/live-env";

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
  process.env.CI ? 150000 : 120000,
);

afterAll(async () => {
  setEnv("DISABLE_TRANSACTION_BROADCAST", broadcastOriginalValue);
  closeBridge();
  await app.common.removeSpeculos();
});
