import { expect } from "@playwright/test";
import { step } from "tests/misc/reporters/step";
import { AppPage } from "tests/page/abstractClasses";
import type { AppInfos } from "@ledgerhq/live-e2e-shared/enum/AppInfos";

type CatalogFilter = "all" | "not_installed" | "supported";
type CatalogSort = "marketcap_desc" | "name_asc" | "name_desc";

const FILTER_LABEL: Record<CatalogFilter, string> = {
  all: "All",
  not_installed: "Not installed",
  supported: "Ledger Wallet supported",
};

const SORT_LABEL: Record<CatalogSort, string> = {
  marketcap_desc: "Market cap",
  name_asc: "Name A-Z",
  name_desc: "Name Z-A",
};

export class MyLedgerPage extends AppPage {
  private readonly storageCard = this.page.getByTestId("device-storage-card");
  private readonly deviceOptions = this.page.getByTestId("device-options-container");

  private readonly catalogTab = this.page.getByTestId("manager-app-catalog-tab");
  private readonly installedAppsTab = this.page.getByTestId("manager-installed-apps-tab");
  private readonly noAppsEmptyState = this.page.getByTestId("manager-no-apps-empty-state");
  private readonly catalogSearch = this.page.getByPlaceholder("Search app in catalog...");
  private readonly installedSearch = this.page.getByPlaceholder("Search installed apps...");

  private readonly filterButton = this.page.getByTestId("manager-filter-button");
  private readonly filterOption = (key: CatalogFilter) =>
    this.page.getByTestId(`manager-filter-option-${key}`);
  private readonly sortButton = this.page.getByTestId("manager-sort-button");
  private readonly sortOption = (key: CatalogSort) =>
    this.page.getByTestId(`manager-sort-option-${key}`);
  private readonly appRows = this.page.locator('[id^="managerAppsList-"]');

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

  private readonly changeLanguageButton = this.page.getByTestId("manager-change-language-button");
  private readonly languageInstallation = this.page.getByTestId(
    "device-language-installation-container",
  );
  private readonly languageOption = (language: string) =>
    this.page.getByTestId(`manager-language-option-${language}`);
  private readonly installLanguageButton = this.page.getByTestId("install-language-button");

  private readonly customImageButton = this.page.getByTestId("manager-custom-image-button");

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

  /** The trigger shows the committed value, so this waits out the 100ms debounce on the list. */
  @step("Filter the catalog by $0")
  async filterCatalogBy(key: CatalogFilter) {
    await this.filterButton.click();
    await this.filterOption(key).click();
    await expect(this.filterButton).toContainText(FILTER_LABEL[key]);
  }

  @step("Sort the catalog by $0")
  async sortCatalogBy(key: CatalogSort) {
    await this.sortButton.click();
    await this.sortOption(key).click();
    await expect(this.sortButton).toContainText(SORT_LABEL[key]);
  }

  /** Row ids are the only DOM-ordered handle the list exposes. */
  @step("Read the listed app names")
  async listedAppNames(): Promise<string[]> {
    return this.appRows.evaluateAll(rows =>
      rows.map(row => row.id.replace("managerAppsList-", "")),
    );
  }

  /** Row ids, not the action buttons: an installed app in the catalog renders neither. */
  @step("Expect $0 to be listed in the catalog")
  async expectAppInCatalog(app: AppInfos) {
    await expect.poll(() => this.listedAppNames()).toContain(app.name);
  }

  @step("Expect $0 not to be listed")
  async expectAppNotListed(app: AppInfos) {
    await expect.poll(() => this.listedAppNames()).not.toContain(app.name);
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

  /** Selecting an option only stages it; the drawer installs on its own submit. */
  @step("Change the device language to $0")
  async changeDeviceLanguage(language: string) {
    await this.changeLanguageButton.click();
    await expect(this.languageInstallation).toBeVisible();
    await this.languageOption(language).click();
    await this.installLanguageButton.click();
  }

  /** The trigger renders the installed language, so it doubles as the read back. */
  @step("Expect the device language to read $0")
  async expectDeviceLanguage(label: string) {
    await expect(this.changeLanguageButton).toContainText(label);
  }

  @step("Open the custom lock screen manager")
  async openCustomLockScreen() {
    await this.customImageButton.click();
  }

  @step("Expect a firmware update to be offered")
  async expectFirmwareUpdateOffered() {
    await expect(this.updateFirmwareButton).toBeVisible();
  }
}
