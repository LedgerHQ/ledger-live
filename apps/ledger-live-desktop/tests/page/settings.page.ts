import { AppPage } from "tests/page/abstractClasses";

export class SettingsPage extends AppPage {
  private accountsTab = this.page.locator("data-test-id=settings-accounts-tab");
  private aboutTab = this.page.locator("data-test-id=settings-about-tab");
  private helpTab = this.page.locator("data-test-id=settings-help-tab");
  private experimentalTab = this.page.locator("data-test-id=settings-experimental-tab");
  private developerTab = this.page.locator("data-test-id=settings-developer-tab");
  private experimentalDevModeToggle = this.page.locator("data-test-id=MANAGER_DEV_MODE-button");
  readonly counterValueSelector = this.page.locator(
    "[data-test-id='setting-countervalue-dropDown'] .select__value-container",
  );
  private counterValueSearchBar = this.page.locator('[placeholder="Search"]');
  private counterValueropdownChoiceEuro = this.page.locator(".select__option");
  readonly languageSelector = this.page.locator(
    "[data-test-id='setting-language-dropDown'] .select__value-container",
  );
  readonly themeSelector = this.page.locator(
    "[data-test-id='setting-theme-dropDown'] .select__value-container",
  );
  private themeChoiceLight = this.page.locator("text='Clair'");
  private versionRow = this.page.locator("data-test-id=version-row");
  private deviceLanguagesDrawer = this.page.locator(
    "data-test-id=device-language-installation-container",
  );
  readonly openLocalManifestFormButton = this.page.locator(
    "data-test-id=settings-open-local-manifest-form",
  );
  readonly exportLocalManifestButton = this.page.locator(
    "data-test-id=settings-export-local-manifest",
  );
  readonly createLocalManifestButton = this.page.locator("data-test-id=create-local-manifest");

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
