import { device } from "detox";
import * as serverBridge from "./bridge/server";
import { getState } from "expect";
import { launchApp, deleteSpeculos, setupEnvironment, takeSpeculosScreenshot } from "./helpers";
import { closeProxy } from "./bridge/proxy";
import { getEnv, setEnv } from "@ledgerhq/live-env";

let testFailed = false;
const broadcastOriginalValue = getEnv("DISABLE_TRANSACTION_BROADCAST");

setupEnvironment();

beforeAll(
  async () => {
    const port = await launchApp();
    await device.reverseTcpPort(8081);
    await device.reverseTcpPort(port);
    await device.reverseTcpPort(52619); // To allow the android emulator to access the dummy app
  },
  process.env.CI ? 150000 : 300000,
);

afterAll(async () => {
  const state = getState();
  if (state.assertionCalls === 0 || state.suppressedErrors.length > 0) testFailed = true;
  if (testFailed) {
    await takeSpeculosScreenshot();
    if (process.env.CI)
      await allure.attachment("App logs", await serverBridge.getLogs(), "application/json");
  }
  setEnv("DISABLE_TRANSACTION_BROADCAST", broadcastOriginalValue);
  serverBridge.close();
  closeProxy();
  await deleteSpeculos();
});
