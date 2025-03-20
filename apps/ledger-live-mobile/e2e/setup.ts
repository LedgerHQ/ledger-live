import { device } from "detox";
import { closeProxy } from "./bridge/proxy";
import { getLogs, close as closeBridge } from "./bridge/server";
import { launchApp, setupEnvironment } from "./globalHelpers";
import { getEnv, setEnv } from "@ledgerhq/live-env";
//import { deleteSpeculos } from "./helpers";

const broadcastOriginalValue = getEnv("DISABLE_TRANSACTION_BROADCAST");
//setupEnvironment();

beforeAll(
  async () => {
    jest.resetModules();
    const port = await launchApp();
    await device.reverseTcpPort(8081);
    await device.reverseTcpPort(port);
    await device.reverseTcpPort(52619); // To allow the android emulator to access the dummy app
  },
  process.env.CI ? 150000 : 300000,
);

/*afterEach(async () => {
  const memoryUsage = process.memoryUsage();
  console.error("Memory Usage:", memoryUsage);
  jestExpect(memoryUsage.heapTotal).toBeLessThan(0);
});*/

afterAll(async () => {
  if (IS_FAILED && process.env.CI) {
    await allure.attachment("App logs", await getLogs(), "application/json");
  }
  setEnv("DISABLE_TRANSACTION_BROADCAST", broadcastOriginalValue);
  closeBridge();
  closeProxy();
  await app.common.removeSpeculos();
  //deleteSpeculos();
  jest.resetModules();
});
