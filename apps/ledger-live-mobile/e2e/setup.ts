import { device } from "detox";
import { close as closeBridge } from "./bridge/server";
import { launchApp, setupEnvironment } from "./helpers/commonHelpers";

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
  closeBridge();
});
