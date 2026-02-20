import { device } from "detox";
import { close as closeBridge } from "./bridge/server";
import { isWallet40, launchApp, setupEnvironment } from "./helpers/commonHelpers";
import { getEnv, setEnv } from "@ledgerhq/live-env";
import { allure } from "jest-allure2-reporter/api";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const MITMPROXY_HAR_PATH = path.resolve(__dirname, "artifacts/mitmproxy-requests.har");
const NETWORK_VIEWER_URL = "https://opensource.saucelabs.com/network-viewer/";

const broadcastOriginalValue = getEnv("DISABLE_TRANSACTION_BROADCAST");
setupEnvironment();

beforeAll(
  async () => {
    const port = await launchApp();
    await device.reverseTcpPort(8081);
    await device.reverseTcpPort(port);
    await device.reverseTcpPort(52619); // To allow the android emulator to access the dummy app
    const testPath = expect.getState().testPath ?? "";
    const testFileName = testPath.replace(/^.*\/(.+?)(?:\.spec)?\.[^.]+$/, "$1");
    // Remove when Wallet 4.0
    const isWallet40Test = isWallet40 || testPath.includes("/wallet40/");
    const mode = isWallet40Test ? "🆕 Wallet 4.0" : "Legacy Wallet";
    allure.description(`Test file: ${testFileName} \n Test run on: ${mode}`);
  },
  process.env.CI ? 150000 : 120000,
);

afterAll(async () => {
  setEnv("DISABLE_TRANSACTION_BROADCAST", broadcastOriginalValue);
  closeBridge();
  await app.common.removeSpeculos();

  if (existsSync(MITMPROXY_HAR_PATH)) {
    const harData = readFileSync(MITMPROXY_HAR_PATH);
    await allure.attachment("Network Traffic (HAR)", harData, "application/har+json");
    allure.link(NETWORK_VIEWER_URL, "🌐 Open in Network Viewer");
  }
});
