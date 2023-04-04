import { Page, Locator } from "@playwright/test";

export class ManagerPage {
  readonly page: Page;
  readonly firmwareUpdateButton: Locator;
  readonly changeDeviceLanguageButton: Locator;
  readonly installedAppsTab: Locator;
  readonly catalogAppsTab: Locator;
  readonly updateAllButton: Locator;
  readonly updateAllProgressBar: Locator;
  readonly changeLanguageOption: (language: string) => Locator;
  readonly appProgressBar: (currency: string) => Locator;
  readonly installAppButton: (currency: string) => Locator;
  readonly uninstallAppButton: (currency: string) => Locator;
  readonly uninstallAllAppsButton: Locator;
  readonly confirmButton: Locator;
  readonly installedAppEmptyState: Locator;
  readonly customImageButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.firmwareUpdateButton = page.locator("data-test-id=manager-update-firmware-button");
    this.changeDeviceLanguageButton = page.locator("data-test-id=manager-change-language-button");
    this.installedAppsTab = page.locator("data-test-id=manager-installed-apps-tab");
    this.catalogAppsTab = page.locator("data-test-id=manager-app-catalog-tab");
    this.updateAllButton = page.locator("data-test-id=manager-update-all-apps-button");
    this.updateAllProgressBar = page.locator("data-test-id=manager-update-all-progress-bar");
    this.changeLanguageOption = language =>
      page.locator(`data-test-id=manager-language-option-${language}`);
    this.appProgressBar = currency =>
      page.locator(`data-test-id=manager-${currency}-app-progress-bar`);
    this.installAppButton = currency =>
      page.locator(`data-test-id=manager-install-${currency}-app-button`);
    this.uninstallAppButton = currency =>
      page.locator(`data-test-id=manager-uninstall-${currency}-app-button`);
    this.uninstallAllAppsButton = page.locator("data-test-id=manager-uninstall-all-apps-button");
    this.confirmButton = page.locator("data-test-id=modal-confirm-button");
    this.installedAppEmptyState = page.locator("data-test-id=manager-no-apps-empty-state");
    this.customImageButton = page.locator("data-test-id=manager-custom-image-button");
  }

  async goToInstalledAppTab() {
    await this.installedAppsTab.click();
  }

  async goToCatalogTab() {
    await this.catalogAppsTab.click();
  }

  async updateAllApps() {
    await this.updateAllButton.click();
    await this.updateAllProgressBar.waitFor({ state: "detached" });
  }

  async installApp(currency: string) {
    await this.installAppButton(currency).click();
    await this.appProgressBar(currency).waitFor({ state: "detached" });
  }

  async openChangeLanguageDrawerAndSelectLanguage(language: string) {
    await this.changeDeviceLanguageButton.click();
    await this.changeLanguageOption(language).waitFor({ state: "visible" });
    await this.changeLanguageOption(language).click();
  }

  async uninstallApp(currency: string) {
    await this.uninstallAppButton(currency).click();
    await this.appProgressBar(currency).waitFor({ state: "detached" });
  }

  async uninstallAllApps() {
    await this.uninstallAllAppsButton.click();
    await this.confirmButton.click();
    await this.installedAppEmptyState.waitFor({ state: "visible" });
  }

  async waitForFirmwareUpdateButton() {
    await this.firmwareUpdateButton.waitFor({ state: "visible" });
  }

  async openFirmwareUpdateModal() {
    await this.firmwareUpdateButton.click();
  }

  async openCustomImage() {
    await this.customImageButton.waitFor({ state: "attached" });
    await this.customImageButton.click();
  }
}
