import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { ManagerPage } from "../../models/ManagerPage";
import { LanguageInstallation } from "../../models/LanguageInstallation";
import { DeviceAction } from "../../models/DeviceAction";
import { Layout } from "../../models/Layout";
import { Drawer } from "tests/models/Drawer";

test.use({ userdata: "skip-onboarding" });
test.use({ env: { FORCE_PROVIDER: 12 } });

// eslint-disable-next-line jest/no-done-callback
test("Manager", async ({ page }) => {
  const managerPage = new ManagerPage(page);
  const languageInstallation = new LanguageInstallation(page);
  const deviceAction = new DeviceAction(page);
  const layout = new Layout(page);
  const drawer = new Drawer(page);

  await test.step("can access manager with l10n firmware", async () => {
    await layout.goToManager();
    await deviceAction.accessManagerWithL10n();
    await managerPage.changeDeviceLanguageButton.waitFor({ state: "visible" });
    await expect(page).toHaveScreenshot("manager-app-catalog-w-l10n.png");
  });

  await test.step("can open change language menu and select language", async () => {
    await managerPage.openChangeLanguageDrawerAndSelectLanguage("french");
    await expect
      .soft(drawer.content)
      .toHaveScreenshot("manager-change-language-drawer-selected.png");
  });

  await test.step("can install language", async () => {
    await languageInstallation.installLanguageButton.click();
    await deviceAction.initiateLanguageInstallation();
    await languageInstallation.allowLanguageInstallation.waitFor({ state: "visible" });
    await expect.soft(drawer.content).toHaveScreenshot("manager-allow-language-installation.png");

    await deviceAction.add50ProgressToLanguageInstallation();
    await languageInstallation.installingLanguageProgress.waitFor({ state: "visible" });
    await expect
      .soft(drawer.content)
      .toHaveScreenshot("manager-language-installation-progress.png");

    await deviceAction.completeLanguageInstallation();
    await languageInstallation.languageInstalled.waitFor({ state: "visible" });
    await expect
      .soft(drawer.content)
      .toHaveScreenshot("manager-language-installation-complete.png");
  });
});
