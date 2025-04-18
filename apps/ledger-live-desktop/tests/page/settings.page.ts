import { AppPage } from "tests/page/abstractClasses";
import { step } from "tests/misc/reporters/step";
import { expect } from "@playwright/test";

export class SettingsPage extends AppPage {
  private accountsTab = this.page.getByTestId("settings-accounts-tab");
  private aboutTab = this.page.getByTestId("settings-about-tab");
  private helpTab = this.page.getByTestId("settings-help-tab");
  readonly experimentalTab = this.page.getByTestId("settings-experimental-tab");
  private developerTab = this.page.getByTestId("settings-developer-tab");
  private experimentalDevModeToggle = this.page.getByTestId("MANAGER_DEV_MODE-button");

  readonly counterValueSelector = this.page.locator(
    "[data-testid='setting-countervalue-dropDown'] .select__value-container",
  );
  private counterValueSearchBar = this.page.locator('[placeholder="Search"]');
  private counterValueropdownChoiceEuro = this.page.locator(".select__option");
  readonly languageSelector = this.page.locator(
    "[data-testid='setting-language-dropDown'] .select__value-container",
  );
  readonly themeSelector = this.page.locator(
    "[data-testid='setting-theme-dropDown'] .select__value-container",
  );
  private themeChoiceLight = this.page.locator("text='Clair'");
  private versionRow = this.page.getByTestId("version-row");
  private deviceLanguagesDrawer = this.page.getByTestId("device-language-installation-container");
  readonly openLocalManifestFormButton = this.page.getByTestId("settings-open-local-manifest-form");
  readonly exportLocalManifestButton = this.page.getByTestId("settings-export-local-manifest");
  readonly createLocalManifestButton = this.page.getByTestId("create-local-manifest");

  @step("Go to Settings Accounts tab")
  async goToAccountsTab() {
    await this.accountsTab.click();
  }

  @step("Go to Settings About tab")
  async goToAboutTab() {
    await this.aboutTab.click();
  }

  @step("Go to Settings Help tab")
  async goToHelpTab() {
    await this.helpTab.click();
  }

  @step("Go to Settings Experimental tab")
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

  @step("Change counter value to $0")
  async changeCounterValue(currency: string) {
    await this.counterValueSelector.click();
    await this.counterValueSearchBar.fill(currency);
    await this.counterValueropdownChoiceEuro.click();
  }

  @step("Expect counter value to be $0")
  async expectCounterValue(currency: string) {
    expect(this.counterValueSelector).toHaveText(currency);
  }

  async changeTheme() {
    await this.themeSelector.click(); // TODO: make this dynamic
    await this.themeChoiceLight.click();
  }

  async waitForDeviceLanguagesLoaded() {
    await this.page.waitForSelector('[aria-label="Select language"]', { state: "attached" });
  }

  async waitForDeviceLauguagesDrawer() {
    await this.deviceLanguagesDrawer.waitFor({ state: "visible" });
  }

  async enableAndGoToDeveloperTab() {
    await this.goToAboutTab();
    for (let i = 0; i < 10; i++) {
      await this.versionRow.click();
    }
    await this.developerTab.click();
  }
}
