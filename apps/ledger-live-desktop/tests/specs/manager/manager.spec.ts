import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { ManagerPage } from "../../page/manager.page";
import { DeviceAction } from "../../models/DeviceAction";
import { Layout } from "../../component/layout.component";

test.use({
  userdata: "skip-onboarding",
  featureFlags: {
    referralProgramDesktopSidebar: { enabled: true },
    protectServicesDesktop: { enabled: true },
  },
});

test("Manager @smoke", async ({ page }) => {
  const managerPage = new ManagerPage(page);
  const deviceAction = new DeviceAction(page);
  const layout = new Layout(page);

  const deviceIllustrationMask = {
    mask: [page.locator('[data-testid="device-storage-card"] img')],
  };

  await test.step("can access manager", async () => {
    await layout.goToManager();
    await deviceAction.accessManager();
    await managerPage.firmwareUpdateButton.waitFor({ state: "visible" });
    await expect(page).toHaveScreenshot("manager-app-catalog.png", deviceIllustrationMask);
  });

  await test.step("can install an app", async () => {
    await managerPage.installApp("Tron");
    await page.getByTestId("manager-installed-apps-tab").waitFor({ state: "visible" });
    await expect.soft(page).toHaveScreenshot("manager-install-tron.png", deviceIllustrationMask);
  });

  await test.step("can access installed apps tab", async () => {
    await managerPage.goToInstalledAppTab();
    await expect.soft(page).toHaveScreenshot("manager-installed-apps.png", deviceIllustrationMask);
  });

  await test.step("can uninstall an app", async () => {
    await managerPage.uninstallApp("Tron");
    await expect.soft(page).toHaveScreenshot("manager-uninstall-tron.png", deviceIllustrationMask);
  });

  await test.step("can update all apps", async () => {
    await managerPage.goToCatalogTab();
    await managerPage.updateAllApps();
    await expect.soft(page).toHaveScreenshot("manager-updateAll.png", deviceIllustrationMask);
  });

  await test.step("can uninstall all apps", async () => {
    await managerPage.goToInstalledAppTab();
    await managerPage.uninstallAllApps();
    await expect.soft(page).toHaveScreenshot("manager-uninstallAll.png", deviceIllustrationMask);
  });
});
