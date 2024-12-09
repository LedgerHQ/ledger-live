import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { SettingsPage } from "../../page/settings.page";
import { Layout } from "../../component/layout.component";

test.use({ userdata: "skip-onboarding" });

test("User able to update currency/language/theme in settings", async ({ page }) => {
  const settingsPage = new SettingsPage(page);
  const layout = new Layout(page);

  await test.step("user change currency", async () => {
    await layout.goToSettings();
    await settingsPage.changeCounterValue("euro");
    await settingsPage.expectCounterValue("Euro - EUR");
  });

  await test.step("user change language", async () => {
    await settingsPage.changeLanguage("English", "Français");
    await expect.soft(settingsPage.languageSelector).toHaveText("Français");
  });

  await test.step("user change Theme", async () => {
    await settingsPage.changeTheme();
    await expect.soft(settingsPage.themeSelector).toHaveText("Clair");
  });
});
