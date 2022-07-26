import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { ManagerPage } from "../../models/ManagerPage";
import { DeviceAction } from "../../models/DeviceAction";
import { Layout } from "../../models/Layout";

test.use({ userdata: "skip-onboarding" });
test.use({ env: { FORCE_PROVIDER: 12 } });

test("Manager", async ({ page }) => {
  const managerPage = new ManagerPage(page);
  const deviceAction = new DeviceAction(page);
  const layout = new Layout(page);

  await test.step("can access manager with l10n firmware", async () => {
    await layout.goToManager();
    await deviceAction.accessManagerWithL10n();
    await managerPage.changeDeviceLanguageButton.waitFor({ state: "visible" });
    await expect(page).toHaveScreenshot("manager-app-catalog-w-l10n.png");
  });

  await test.step("can open change language menu and select language", async () => {
    await managerPage.openChangeLanguageDrawerAndSelectLanguage("french");
    await expect.soft(page).toHaveScreenshot("manager-change-language-drawer-selected.png");
  });

  await test.step("can install language", async () => {
    await managerPage.installLanguageButton.click();
    await deviceAction.initiateLanguageInstallation();
    await managerPage.allowLanguageInstallation.waitFor({ state: "visible" });
    await expect.soft(page).toHaveScreenshot("manager-allow-language-installation.png");
    
    await deviceAction.add50ProgressToLanguageInstallation();
    await managerPage.installingLanguageProgress.waitFor({ state: "visible" });
    await expect.soft(page).toHaveScreenshot("manager-language-installation-progress.png");

    await deviceAction.completeLanguageInstallation();
    await managerPage.languageInstalled.waitFor({ state: "visible" });
    await expect.soft(page).toHaveScreenshot("manager-language-installation-complete.png");
  });

  await test.step("language gets updated on manager", async () => {
    await managerPage.closeLanguageInstallationButton.click();
    await managerPage.changeDeviceLanguageButton.waitFor({ state: "visible" });
    await expect(managerPage.changeDeviceLanguageButton).toContainText("French");
  });
});