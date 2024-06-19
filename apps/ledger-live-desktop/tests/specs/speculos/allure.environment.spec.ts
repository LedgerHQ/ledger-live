import fs from "fs";
import test from "../../fixtures/common";
import { allure } from "allure-playwright";
import { formatFlagsData, formatEnvData } from "@ledgerhq/live-common/e2e/index";
import { Application } from "tests/page";

const environmentFilePath = "allure-results/environment.properties";

test.describe.parallel("Get allure environment @smoke", () => {
  test.use({
    userdata: "skip-onboarding",
  });

  test(`write in Allure environment file`, async ({ page }) => {
    const app = new Application(page);
    await app.portfolio.expectPortfolioEmpty();

    const featureFlags = await page.evaluate(() => {
      return window.getAllFeatureFlags("en");
    });
    const appEnvs = await page.evaluate(() => {
      return window.getAllEnvs();
    });

    await allure.attachment("Feature Flags", JSON.stringify(featureFlags), "application/json");
    await allure.attachment("Environment Variables", JSON.stringify(appEnvs), "application/json");
    fs.writeFileSync(environmentFilePath, formatFlagsData(featureFlags) + formatEnvData(appEnvs));
  });
});
