import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { SettingsPage } from "../../models/SettingsPage";
import { Layout } from "../../models/Layout";

test.use({ userdata: "skip-onboarding" });

test("Settings", async ({ page }) => {
  const settingsPage = new SettingsPage(page);
  const layout = new Layout(page);

  await test.step("go to settings", async () => {
    await layout.goToSettings();
    await expect(page).toHaveScreenshot("settings-general-page.png");
  });

  await test.step("go to settings -> developer", async () => {
    await settingsPage.goToAccountsTab();
    await settingsPage.enableAndGoToDeveloperTab();
  });

  /**await test.step("developer -> create local manifest", async () => {
  });*/
});
