import { Page, Locator } from '@playwright/test';

export class SettingsPage {
  readonly page: Page;
  readonly accountsTab: Locator;
  readonly aboutTab: Locator;
  readonly helpTab: Locator;
  readonly experimentalTab: Locator;
  readonly experimentalDevModeToggle: Locator;
  readonly carouselSwitchButton: Locator;
  readonly counterValueSelector: Locator;

  constructor(page: Page) {
    this.page = page;
    this.accountsTab = page.locator('data-test-id=settings-accounts-tab');
    this.aboutTab = page.locator('data-test-id=settings-about-tab');
    this.helpTab = page.locator('data-test-id=settings-help-tab');
    this.experimentalTab = page.locator('data-test-id=settings-experimental-tab');
    this.experimentalDevModeToggle = page.locator('data-test-id=MANAGER_DEV_MODE-button');
    this.carouselSwitchButton = page.locator('data-test-id=settings-carousel-switch-button');
    this.counterValueSelector = page.locator('.select__value-container').first();
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

  async enableDevMode() {
    await this.experimentalDevModeToggle.click();
  }

  async changeCounterValue() {
    await this.counterValueSelector.click();
    await this.page.locator('[placeholder="Search"]').fill("euro");
    await this.page.locator("#react-select-2-option-15 >> text=Euro - EUR").click();
  }

  async changeLanguage() {
    await this.page
      .locator("div:nth-child(2) > .sc-dkzDqf.uXYMl > .css-198krsd-container > .select__control")
      .click();
    await this.page.locator(".css-1dsbpcp").click();
  }

  async changeTheme() {
    await this.page.locator("#react-select-3-option-2").click();
    await this.page.locator("text=Clair").click();
  }
}
