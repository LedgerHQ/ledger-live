import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { SettingsPage } from "../../models/SettingsPage";
import { Layout } from "../../models/Layout";
import { DeviceAction } from "../../models/DeviceAction";
import { LanguageInstallation } from "../../models/LanguageInstallation";
import { languagePacksData } from "./data";

test.use({ userdata: "skip-onboarding" });
test.use({ env: { FORCE_PROVIDER: 12 } });

test("Settings", async ({ page }) => {
  const deviceAction = new DeviceAction(page);
  const languageInstallation = new LanguageInstallation(page);
  const settingsPage = new SettingsPage(page);
  const layout = new Layout(page);

  await test.step("go to settings -> change language to french with no device", async () => {
    await layout.goToSettings();
    await settingsPage.changeLanguage("English", "Français");
    await expect(page).toHaveScreenshot("settings-français.png");
  });

  await test.step("go to settings -> change language with device in English", async () => {
    await page.route("**/language-package?**", route =>
      route.fulfill({
        status: 200,
        body: JSON.stringify(languagePacksData),
      }),
    );
    await layout.goToManager();
    await deviceAction.accessManagerWithL10n();
    await layout.goToSettings();
    // the device language prompt only opens once the app has charged the available languages for the device
    // I've tried to wait for a network idle state here, but it seemed flaky, timeout seems more reliable
    await page.waitForTimeout(3000);
    await settingsPage.changeLanguage("Français", "Español");
    await expect(page).toHaveScreenshot("settings-français-with-device-l10n.png");
  });

  await test.step("accept and install language change on device", async () => {
    await languageInstallation.installLanguageButton.click();
    await deviceAction.initiateLanguageInstallation();
    await languageInstallation.allowLanguageInstallation.waitFor({ state: "visible" });
    await expect.soft(page).toHaveScreenshot("settings-allow-language-installation.png");

    await deviceAction.add50ProgressToLanguageInstallation();
    await languageInstallation.installingLanguageProgress.waitFor({ state: "visible" });
    await expect.soft(page).toHaveScreenshot("settings-language-installation-progress.png");

    await deviceAction.completeLanguageInstallation();
    await languageInstallation.languageInstalled.waitFor({ state: "visible" });
    await expect.soft(page).toHaveScreenshot("settings-language-installation-complete.png");
  });
});
