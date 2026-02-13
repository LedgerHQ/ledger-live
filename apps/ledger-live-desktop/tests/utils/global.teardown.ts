import { formatFlagsData, formatEnvData } from "@ledgerhq/live-common/e2e/index";
import fs from "fs";
import { ElectronApplication } from "@playwright/test";
import { OnboardingPage } from "../page/onboarding.page";
import { launchApp } from "tests/utils/electronUtils";

const environmentFilePath = "allure-results/environment.properties";

export default async function globalTeardown() {
  if (process.env.CI) {
    // Hardcode specific feature flags for teardown
    const hardcodedFeatureFlags = {
      welcomeScreenVideoCarousel: { enabled: false },
      noah: { enabled: false },
    };

    const electronApp: ElectronApplication = await launchApp({
      env: Object.assign({}, process.env as Record<string, string>, {
        FEATURE_FLAGS: JSON.stringify(hardcodedFeatureFlags),
      }),
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
    await new Promise(s => setTimeout(s, 5000));

    await new OnboardingPage(page).waitForLaunch();

    const featureFlags = await page.evaluate(() => {
      return window.getAllFeatureFlags("en");
    });
    const appEnvs = await page.evaluate(() => {
      return window.getAllEnvs();
    });

    fs.writeFileSync(environmentFilePath, formatFlagsData(featureFlags) + formatEnvData(appEnvs));
  }
}
