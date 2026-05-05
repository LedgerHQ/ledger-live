import { formatFlagsData, formatEnvData } from "@ledgerhq/live-common/e2e/index";
import { writeFileSync } from "fs";
import { ElectronApplication, expect } from "@playwright/test";
import { launchApp } from "./electronUtils";
import { getFeatureFlags } from "./featureFlagUtils";

const environmentFilePath = "allure-results/environment.properties";

export default async function globalTeardown() {
  if (process.env.CI) {
    const electronApp: ElectronApplication = await launchApp({
      env: Object.assign(process.env),
      lang: "en-US",
      theme: "dark",
      userdataDestinationPath: "",
      simulateCamera: "",
      windowSize: { width: 1024, height: 768 },
    });
    const page = await electronApp.firstWindow();
    page.setDefaultTimeout(99000);

    // wait for app is loaded
    await page.waitForLoadState("domcontentloaded");
    await page.waitForSelector("#loader-container", { state: "hidden" });

    // wait for app envs to be available
    let appEnvsString = "";
    try {
      await expect
        .poll(
          async () => {
            const appEnvs = await page.evaluate(() => {
              return window.getAllEnvs();
            });
            if (Object.keys(appEnvs).length > 0) {
              appEnvsString = formatEnvData(appEnvs);
            }
            return appEnvsString.length;
          },
          { timeout: 30_000, intervals: [1_000] },
        )
        .toBeGreaterThan(0);
    } catch (error) {
      console.log("Failed to retrieve app envs,", error);
    }

    // wait for feature flags to be available
    let featureFlagsString = "";
    try {
      await expect
        .poll(
          async () => {
            const featureFlags = await getFeatureFlags(page);
            if (Object.keys(featureFlags).length > 0) {
              featureFlagsString = formatFlagsData(featureFlags);
            }
            return featureFlagsString.length;
          },
          { timeout: 30_000, intervals: [1_000] },
        )
        .toBeGreaterThan(0);
    } catch (error) {
      console.log("Failed to retrieve feature flags,", error);
    }

    writeFileSync(environmentFilePath, featureFlagsString + appEnvsString, {
      encoding: "utf8",
      flag: "a",
    });
  }
}
