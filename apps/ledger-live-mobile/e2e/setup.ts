import { device } from "detox";
import { getLogs, close as closeBridge } from "./bridge/server";
import { launchApp, setupEnvironment } from "./helpers/commonHelpers";

setupEnvironment();

beforeAll(
  async () => {
    const port = await launchApp(true);
    await device.reverseTcpPort(8081);
    await device.reverseTcpPort(port);
    await device.reverseTcpPort(52619); // To allow the android emulator to access the dummy app
    const testFileName = expect.getState().testPath?.replace(/^.*\/(.+?)(?:\.spec)?\.[^.]+$/, "$1");
    allure.description("Test file : " + testFileName);
  },
  process.env.CI ? 150000 : 300000,
);

afterAll(async () => {
  if (IS_FAILED && process.env.CI) {
    await allure.attachment("App logs", await getLogs(), "application/json");
  }
  closeBridge();
});
