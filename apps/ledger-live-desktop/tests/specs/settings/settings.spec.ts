import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { SettingsPage } from "../../page/settings.page";
import { Layout } from "../../component/layout.component";

test.use({ userdata: "skip-onboarding" });

test("Settings", async ({ page }, testInfo) => {
  // FLAKE-SIM: test-quarantine pipeline validation — REMOVE BEFORE MERGE.
  // Playwright exposes the attempt directly, so no counter is needed: retry 0 is
  // the first run. CI-only, matching `retries: process.env.CI ? 1 : 0`.
  if (process.env.CI && testInfo.retry === 0) {
    throw new Error("FLAKE-SIM: forced failure on attempt 1 (desktop playwright)");
  }

  const settingsPage = new SettingsPage(page);
  const layout = new Layout(page);

  await test.step("go to settings", async () => {
    await layout.goToSettings();
    await page.getByTestId("settings-accounts-tab").waitFor({ state: "visible" });
    await expect(page).toHaveScreenshot("settings-general-page.png");
  });

  await test.step("go to settings -> accounts", async () => {
    await settingsPage.goToAccountsTab();
    await expect.soft(page).toHaveScreenshot("settings-accounts-page.png");
  });

  await test.step("go to settings -> about", async () => {
    await settingsPage.goToAboutTab();
    await expect.soft(page).toHaveScreenshot("settings-about-page.png");
  });

  await test.step("go to settings -> help", async () => {
    await settingsPage.goToHelpTab();
    await expect.soft(page).toHaveScreenshot("settings-help-page.png");
  });

  await test.step("go to settings -> experimental", async () => {
    await settingsPage.goToExperimentalTab();
    await expect.soft(page).toHaveScreenshot("settings-experimental-page.png");
  });
});
