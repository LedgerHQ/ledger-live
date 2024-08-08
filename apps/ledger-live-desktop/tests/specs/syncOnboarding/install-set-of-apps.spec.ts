import { expect } from "@playwright/test";
import test from "../../fixtures/common";
import { InstallSetOfApps } from "../../page/install.page";
import { SettingsPage } from "../../page/settings.page";
import { Layout } from "../../component/layout.component";
import { DeviceAction } from "../../models/DeviceAction";

test.use({
  userdata: "skip-onboarding",
  featureFlags: {
    deviceInitialApps: { params: { apps: ["Bitcoin", "Ethereum", "Polygon"] }, enabled: true },
  },
});

test("Install set of apps", async ({ page }) => {
  const settingsPage = new SettingsPage(page);
  const layout = new Layout(page);
  const deviceAction = new DeviceAction(page);
  const installSetOfAppsPage = new InstallSetOfApps(page);
  const container = installSetOfAppsPage.container;

  await test.step("go to debug install set of apps drawer", async () => {
    await layout.goToSettings();
    await settingsPage.goToAboutTab();
    await settingsPage.enableAndGoToDeveloperTab();
    await installSetOfAppsPage.waitForLaunch();
    await installSetOfAppsPage.accessDebugInstallSetOfApps();
    await installSetOfAppsPage.waitForDrawerIsOpen();
    await expect(container).toHaveScreenshot("debug-install-set-of-apps-drawer.png");
  });

  await test.step("use default apps", async () => {
    await installSetOfAppsPage.startInstallOrRestoreSetOfApps();
    await deviceAction.resolveDependenciesMocked(["Bitcoin", "Ethereum", "Polygon"]);
    await expect(container).toHaveScreenshot("debug-install-set-of-apps-queue.png");
    await deviceAction.installSetOfAppsMocked(0.12, 0.25, { type: "install", name: "Bitcoin" }, [
      "Bitcoin",
      "Ethereum",
      "Polygon",
    ]);
    await installSetOfAppsPage.waitForCircleProgress("42.4115");
    await expect(container).toHaveScreenshot("debug-install-set-of-apps-step-1.png");
    await deviceAction.installSetOfAppsMocked(0.5, 0.5, { type: "install", name: "Ethereum" }, [
      "Ethereum",
      "Polygon",
    ]);
    await installSetOfAppsPage.waitForCircleProgress("28.2743");
    await expect(container).toHaveScreenshot("debug-install-set-of-apps-step-2.png");
    await deviceAction.installSetOfAppsMocked(0.87, 0.75, { type: "install", name: "Polygon" }, [
      "Polygon",
    ]);
    await installSetOfAppsPage.waitForCircleProgress("14.1372");
    await expect(container).toHaveScreenshot("debug-install-set-of-apps-step-3.png");
    await deviceAction.mockOpened();
    await installSetOfAppsPage.waitForInstallingTextToDisappear();
    await expect(container).toHaveScreenshot("debug-install-set-of-apps-completed.png");
    await deviceAction.complete();
  });

  await test.step("restore apps from Ledger Stax", async () => {
    await installSetOfAppsPage.resetButtonClick();
    await deviceAction.resolveDependenciesMocked(["Ethereum", "Polygon"]);
    await expect(container).toHaveScreenshot("debug-install-set-of-apps-reseted.png");
    await deviceAction.installSetOfAppsMocked(0, 0, { type: "install", name: "Bitcoin" }, [
      "Ethereum",
      "Polygon",
    ]);
    await installSetOfAppsPage.startRestoreAppsFromStax();
    await expect(container).toHaveScreenshot("debug-restore-set-of-apps-drawer.png");
    await installSetOfAppsPage.startInstallOrRestoreSetOfApps();
    await expect(container).toHaveScreenshot("debug-restore-set-of-apps-queue.png");
    await deviceAction.installSetOfAppsMocked(0.3, 0.15, { type: "install", name: "Ethereum" }, [
      "Ethereum",
      "Polygon",
    ]);
    await installSetOfAppsPage.waitForCircleProgress("48.0664");
    await expect(container).toHaveScreenshot("debug-restore-set-of-apps-step-1.png");
    await deviceAction.installSetOfAppsMocked(0.67, 0.7, { type: "install", name: "Polygon" }, [
      "Polygon",
    ]);
    await installSetOfAppsPage.waitForCircleProgress("16.9646");
    await expect(container).toHaveScreenshot("debug-restore-set-of-apps-step-2.png");
    await deviceAction.mockOpened();
    await installSetOfAppsPage.waitForInstallingTextToDisappear();
    await expect(container).toHaveScreenshot("debug-restore-set-of-apps-completed.png");
    await deviceAction.complete();
  });

  await test.step("skip install or restore set of apps step", async () => {
    await installSetOfAppsPage.resetButtonClick();
    await installSetOfAppsPage.skipInstallOrRestoreSetOfApps();
    await expect(container).toHaveScreenshot("debug-step-set-of-apps-completed.png");
  });
});
