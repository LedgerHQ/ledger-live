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
  readonly counterValuedropdownChoiceEuro: Locator;
  readonly languageSelector: Locator;
  readonly languageChoiceFrench: Locator;
  readonly themeSelector: Locator;
  readonly themeChoiceLight: Locator;

  constructor(page: Page) {
    this.page = page;
    this.accountsTab = page.locator("data-test-id=settings-accounts-tab");
    this.aboutTab = page.locator("data-test-id=settings-about-tab");
    this.helpTab = page.locator("data-test-id=settings-help-tab");
    this.experimentalTab = page.locator("data-test-id=settings-experimental-tab");
    this.experimentalDevModeToggle = page.locator("data-test-id=MANAGER_DEV_MODE-button");
    this.carouselSwitchButton = page.locator("data-test-id=settings-carousel-switch-button");
    this.counterValueSelector = page.locator(".select__value-container").first();
    this.counterValueSearchBar = page.locator('[placeholder="Search"]');
    this.counterValuedropdownChoiceEuro = page.locator(
      "#react-select-2-option-15 >> text=Euro - EUR",
    );
    this.languageSelector = page.locator(
      "div:nth-child(2) > .sc-dkzDqf.uXYMl > .css-198krsd-container > .select__control > .select__value-container",
    );
    this.themeSelector = page.locator(
      "div:nth-child(4) > .sc-dkzDqf.uXYMl > .css-198krsd-container > .select__control > .select__value-container",
    );
    this.themeChoiceLight = page.locator("#react-select-5-option-1");
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
    await this.counterValuedropdownChoiceEuro.click();
  }

  async changeTheme() {
    await this.themeSelector.click();
    await this.themeChoiceLight.click();
  }
}
