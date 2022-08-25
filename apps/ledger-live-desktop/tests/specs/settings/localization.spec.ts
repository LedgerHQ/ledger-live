import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { SettingsPage } from "../../models/SettingsPage";
import { Layout } from "../../models/Layout";
import { DeviceAction } from "tests/models/DeviceAction";
import { languagePacksData } from "./data";

test.use({ userdata: "skip-onboarding" });
test.use({ env: { FORCE_PROVIDER: 12 } });

test("Settings", async ({ page }) => {
  const deviceAction = new DeviceAction(page);
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
    await page.waitForResponse("**/language-package?**");
    await settingsPage.changeLanguage("Français", "Español");
    await page.pause();
    //await expect(page).toHaveScreenshot("settings-français-with-device-l10n.png");
  });
});
