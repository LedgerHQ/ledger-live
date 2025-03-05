import { device } from "detox";
import * as serverBridge from "./bridge/server";
import { launchApp, deleteSpeculos, setupEnvironment } from "./helpers";
import { closeProxy } from "./bridge/proxy";
import { getEnv, setEnv } from "@ledgerhq/live-env";

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
  if (IS_FAILED && process.env.CI) {
    await allure.attachment("App logs", await serverBridge.getLogs(), "application/json");
  }
  setEnv("DISABLE_TRANSACTION_BROADCAST", broadcastOriginalValue);
  serverBridge.close();
  closeProxy();
  await deleteSpeculos();
});
