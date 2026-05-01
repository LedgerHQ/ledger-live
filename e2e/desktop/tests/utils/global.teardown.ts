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

    // wait for feature flags to be available
    const featureFlags = await getFeatureFlags(page);

    // wait for env variables to be available
    const getAppEnvsPromise = async () =>
      page.evaluate(() => {
        return window.getAllEnvs();
      });

    await expect
      .poll(
        async () => {
          const appEnvsResult = await getAppEnvsPromise();
          return Object.keys(appEnvsResult).length;
        },
        {
          intervals: [1_000],
          message: "Should have at least one env variable",
        },
      )
      .toBeGreaterThanOrEqual(1);

    const appEnvs = await getAppEnvsPromise();

    // write to file for allure reporting
    writeFileSync(environmentFilePath, formatFlagsData(featureFlags) + formatEnvData(appEnvs), {
      encoding: "utf8",
      flag: "a",
    });
  }
}
