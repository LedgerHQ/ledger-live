import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { SettingsPage } from "../../page/settings.page";
import { Layout } from "../../component/layout.component";
import { DeviceAction } from "../../models/DeviceAction";
import { LanguageInstallation } from "../../page/drawer/language.installation.drawer";
import { languagePacksData } from "./data";

test.use({ userdata: "skip-onboarding" });
test.use({ env: { FORCE_PROVIDER: "12" } });

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
    await page.route("**/language-package?**", route => {
      route.fulfill({
        headers: { teststatus: "mocked" },
        status: 200,
        body: JSON.stringify(languagePacksData),
      });
    });
    await layout.goToManager();
    await deviceAction.accessManagerWithL10n();
    await layout.goToSettings();

    await settingsPage.waitForDeviceLanguagesLoaded();

    await settingsPage.changeLanguage("Français", "Español");

    await settingsPage.waitForDeviceLauguagesDrawer();

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
