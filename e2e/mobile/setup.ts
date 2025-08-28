import { device } from "detox";
import { execSync } from "child_process";
import { close as closeBridge, getLogs } from "./bridge/server";
import { launchApp, setupEnvironment } from "./helpers/commonHelpers";
import { getEnv, setEnv } from "@ledgerhq/live-env";
import { allure } from "jest-allure2-reporter/api";

const broadcastOriginalValue = getEnv("DISABLE_TRANSACTION_BROADCAST");
setupEnvironment();

beforeAll(
  async () => {
    const port = await launchApp();
    await device.reverseTcpPort(8081);
    await device.reverseTcpPort(port);
    await device.reverseTcpPort(52619); // To allow the android emulator to access the dummy app
    // Log simulator/emulator OS version for CI visibility
    try {
      const platform = device.getPlatform();
      if (platform === "android") {
        const devicesList = execSync("adb devices").toString().split("\n");
        const firstDeviceLine = devicesList.map(l => l.trim()).find(l => /\tdevice$/.test(l)) || "";
        const serial = firstDeviceLine.split("\t")[0];
        const release = execSync(`adb -s ${serial} shell getprop ro.build.version.release`)
          .toString()
          .trim();
        const sdk = execSync(`adb -s ${serial} shell getprop ro.build.version.sdk`)
          .toString()
          .trim();
        console.error(`[E2E] Android OS ${release} (SDK ${sdk}) on ${serial}`);
      } else {
        const json = execSync("xcrun simctl list --json devices").toString();
        type DeviceEntry = { udid: string; name: string; state: string };
        const data = JSON.parse(json) as { devices: Record<string, DeviceEntry[]> };
        const entries = Object.entries(data.devices);
        let found: DeviceEntry | undefined;
        let runtimeKey: string | undefined;
        for (const [key, list] of entries) {
          const match = list.find(d => d.state === "Booted");
          if (match) {
            found = match;
            runtimeKey = key;
            break;
          }
        }
        let version = "unknown";
        if (runtimeKey) {
          const m = /iOS[- ]([\d\-.]+)/.exec(runtimeKey);
          if (m && m[1]) version = m[1].replace(/-/g, ".");
        }
        console.error(`[E2E] iOS ${version} on ${found?.name || found?.udid || "unknown"}`);
      }
    } catch (e) {
      console.warn(`[E2E] Failed to detect device OS version: ${String(e)}`);
    }
    const testFileName = expect.getState().testPath?.replace(/^.*\/(.+?)(?:\.spec)?\.[^.]+$/, "$1");
    allure.description("Test file : " + testFileName);
  },
  process.env.CI ? 150000 : 120000,
);

afterAll(async () => {
  if (IS_FAILED && process.env.CI) {
    await allure.attachment("App logs", await getLogs(), "application/json");
  }
  setEnv("DISABLE_TRANSACTION_BROADCAST", broadcastOriginalValue);
  await app.common.removeSpeculos();
  closeBridge();
});
