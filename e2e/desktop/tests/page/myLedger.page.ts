import { expect } from "@playwright/test";
import { step } from "tests/misc/reporters/step";
import { AppPage } from "tests/page/abstractClasses";
import type { AppInfos } from "@ledgerhq/live-e2e-shared/enum/AppInfos";

export class MyLedgerPage extends AppPage {
  private readonly storageCard = this.page.getByTestId("device-storage-card");
  private readonly deviceOptions = this.page.getByTestId("device-options-container");

  private readonly catalogTab = this.page.getByTestId("manager-app-catalog-tab");
  private readonly installedAppsTab = this.page.getByTestId("manager-installed-apps-tab");
  private readonly noAppsEmptyState = this.page.getByTestId("manager-no-apps-empty-state");
  private readonly catalogSearch = this.page.getByPlaceholder("Search app in catalog...");
  private readonly installedSearch = this.page.getByPlaceholder("Search installed apps...");

  private readonly installButton = (app: AppInfos) =>
    this.page.getByTestId(`manager-install-${app.name}-app-button`);
  private readonly uninstallButton = (app: AppInfos) =>
    this.page.getByTestId(`manager-uninstall-${app.name}-app-button`);
  private readonly appProgressBar = (app: AppInfos) =>
    this.page.getByTestId(`manager-${app.name}-app-progress-bar`);

  private readonly uninstallAllButton = this.page.getByTestId("manager-uninstall-all-apps-button");
  private readonly confirmModalButton = this.page.getByTestId("modal-confirm-button");
  private readonly updateAllButton = this.page.getByTestId("manager-update-all-apps-button");
  private readonly updateAllProgressBar = this.page.getByTestId("manager-update-all-progress-bar");

  private readonly renameContainer = this.page.getByTestId("device-rename-container");
  private readonly deviceNameInput = this.page.getByTestId("current-device-name-input");
  private readonly deviceRenamed = this.page.getByTestId("device-renamed");

  private readonly changeLanguageButton = this.page.getByTestId("manager-change-language-button");
  private readonly languageInstallation = this.page.getByTestId(
    "device-language-installation-container",
  );
  private readonly languageOption = (language: string) =>
    this.page.getByTestId(`manager-language-option-${language}`);

  private readonly customImageButton = this.page.getByTestId("manager-custom-image-button");
  private readonly removeImageContainer = this.page.getByTestId("device-remove-image-container");
  private readonly closeImageRemoval = this.page.getByTestId(
    "close-device-custom-image-removal-button",
  );

  private readonly updateFirmwareButton = this.page.getByTestId("manager-update-firmware-button");

  /**
   * `/manager` renders a DeviceAction that connects and runs `listApps` before the
   * dashboard exists, so every My Ledger test starts by waiting on the storage card.
   */
  @step("Wait for My Ledger to finish connecting")
  async waitForDashboard() {
    await expect(this.storageCard).toBeVisible();
    await expect(this.deviceOptions).toBeVisible();
  }

  @step("Open the app catalog tab")
  async openCatalogTab() {
    await this.catalogTab.click();
    await expect(this.catalogSearch).toBeVisible();
  }

  @step("Open the installed apps tab")
  async openInstalledAppsTab() {
    await this.installedAppsTab.click();
  }

  @step("Search the catalog for $0")
  async searchCatalog(query: string) {
    await this.catalogSearch.fill(query);
  }

  @step("Search the installed apps for $0")
  async searchInstalledApps(query: string) {
    await this.installedSearch.fill(query);
  }

  @step("Expect $0 to be listed in the catalog")
  async expectAppInCatalog(app: AppInfos) {
    await expect(this.installButton(app).or(this.uninstallButton(app))).toBeVisible();
  }

  @step("Expect $0 not to be listed")
  async expectAppNotListed(app: AppInfos) {
    await expect(this.installButton(app)).toBeHidden();
    await expect(this.uninstallButton(app)).toBeHidden();
  }

  @step("Install $0")
  async installApp(app: AppInfos) {
    await this.installButton(app).click();
  }

  @step("Uninstall $0")
  async uninstallApp(app: AppInfos) {
    await this.uninstallButton(app).click();
  }

  /** The progress bar is removed once the queue drains, which is what marks the app installed. */
  @step("Expect $0 to be installed")
  async expectAppInstalled(app: AppInfos) {
    await expect(this.appProgressBar(app)).toBeHidden();
    await expect(this.uninstallButton(app)).toBeVisible();
  }

  @step("Expect $0 to be uninstalled")
  async expectAppUninstalled(app: AppInfos) {
    await expect(this.appProgressBar(app)).toBeHidden();
    await expect(this.installButton(app)).toBeVisible();
  }

  /** The button only opens a confirm modal; the wipe is dispatched by confirming it. */
  @step("Uninstall every app")
  async uninstallAllApps() {
    await this.uninstallAllButton.click();
    await this.confirmModalButton.click();
  }

  @step("Expect no app to be installed")
  async expectNoAppsInstalled() {
    await expect(this.noAppsEmptyState).toBeVisible();
  }

  @step("Update every app")
  async updateAllApps() {
    await this.updateAllButton.click();
    await expect(this.updateAllProgressBar).toBeHidden();
  }

  @step("Rename the device to $0")
  async renameDevice(name: string) {
    await this.renameContainer.click();
    await this.deviceNameInput.fill(name);
    await this.deviceNameInput.press("Enter");
    await expect(this.deviceRenamed).toBeVisible();
  }

  @step("Change the device language to $0")
  async changeDeviceLanguage(language: string) {
    await this.changeLanguageButton.click();
    await expect(this.languageInstallation).toBeVisible();
    await this.languageOption(language).click();
  }

  @step("Open the custom lock screen manager")
  async openCustomLockScreen() {
    await this.customImageButton.click();
  }

  @step("Remove the custom lock screen")
  async removeCustomLockScreen() {
    await expect(this.removeImageContainer).toBeVisible();
    await this.closeImageRemoval.click();
  }

  @step("Expect a firmware update to be offered")
  async expectFirmwareUpdateOffered() {
    await expect(this.updateFirmwareButton).toBeVisible();
  }
}
