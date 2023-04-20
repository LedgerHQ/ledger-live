import { Page, Locator } from "@playwright/test";

export class SettingsPage {
  readonly page: Page;
  readonly accountsTab: Locator;
  readonly aboutTab: Locator;
  readonly helpTab: Locator;
  readonly experimentalTab: Locator;
  readonly experimentalDevModeToggle: Locator;
  readonly carouselSwitchButton: Locator;
  readonly counterValueSelector: Locator;
  readonly counterValueSearchBar: Locator;
  readonly counterValueropdownChoiceEuro: Locator;
  readonly languageSelector: Locator;
  readonly themeSelector: Locator;
  readonly themeChoiceLight: Locator;
  readonly versionRow: Locator;
  readonly developerTab: Locator;

  constructor(page: Page) {
    this.page = page;
    this.accountsTab = page.locator("data-test-id=settings-accounts-tab");
    this.aboutTab = page.locator("data-test-id=settings-about-tab");
    this.helpTab = page.locator("data-test-id=settings-help-tab");
    this.experimentalTab = page.locator("data-test-id=settings-experimental-tab");
    this.developerTab = page.locator("data-test-id=settings-developer-tab");
    this.experimentalDevModeToggle = page.locator("data-test-id=MANAGER_DEV_MODE-button");
    this.carouselSwitchButton = page.locator("data-test-id=settings-carousel-switch-button");
    this.counterValueSelector = page.locator(
      "[data-test-id='setting-countervalue-dropDown'] .select__value-container",
    );
    this.counterValueSearchBar = page.locator('[placeholder="Search"]');
    this.counterValueropdownChoiceEuro = page.locator(".select__option");
    this.languageSelector = page.locator(
      "[data-test-id='setting-language-dropDown'] .select__value-container",
    );
    this.themeSelector = page.locator(
      "[data-test-id='setting-theme-dropDown'] .select__value-container",
    );

    this.themeChoiceLight = page.locator("text='Clair'");
    this.versionRow = page.locator("data-test-id=version-row");
  }

  async goToAccountsTab() {
    await this.accountsTab.click();
  }

  async goToAboutTab() {
    await this.aboutTab.click();
  }

  async goToHelpTab() {
    await this.helpTab.click();
  }

  async goToExperimentalTab() {
    await this.experimentalTab.click();
  }

  async changeLanguage(fromLanguage: string, toLanguage: string) {
    await this.page.locator(`text="${fromLanguage}"`).click();
    await this.page.locator(`text="${toLanguage}"`).click();
  }

  async enableDevMode() {
    await this.experimentalDevModeToggle.click();
  }

  async changeCounterValue() {
    await this.counterValueSelector.click();
    await this.counterValueSearchBar.fill("euro");
    await this.counterValueropdownChoiceEuro.click();
  }

  async changeTheme() {
    await this.themeSelector.click(); // TODO: make this dynamic
    await this.themeChoiceLight.click();
  }

  async enableAndGoToDeveloperTab() {
    for (let i = 0; i < 10; i++) {
      await this.versionRow.click();
    }
    await this.developerTab.click();
  }
}
