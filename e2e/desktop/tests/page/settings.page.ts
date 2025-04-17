import { AppPage } from "./abstractClasses";
import { step } from "../misc/reporters/step";
import { expect } from "@playwright/test";
import axios from "axios";

export class SettingsPage extends AppPage {
  private manageLedgerSyncButton = this.page.getByRole("button", { name: "Manage" });
  private clearCacheButton = this.page.getByRole("button", { name: "Clear" });
  private confirmButton = this.page.getByRole("button", { name: "Confirm" });
  private accountsTab = this.page.getByTestId("settings-accounts-tab");
  private aboutTab = this.page.getByTestId("settings-about-tab");
  private helpTab = this.page.getByTestId("settings-help-tab");
  readonly experimentalTab = this.page.getByTestId("settings-experimental-tab");
  private ledgerSupport = this.page.getByTestId("ledgerSupport-link");
  private resetAppButton = this.page.getByTestId("reset-button");

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
  private hideEmptyTokenAccountsToggle = this.page.getByTestId("hideEmptyTokenAccounts");

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

  @step("Change counter value to $0")
  async changeCounterValue(currency: string) {
    await this.counterValueSelector.click();
    await this.counterValueSearchBar.fill(currency);
    await this.counterValueropdownChoiceEuro.click();
  }

  @step("Expect counter value to be $0")
  async expectCounterValue(currency: string) {
    await expect(this.counterValueSelector).toHaveText(currency);
  }

  @step("Click 'Hide Empty Token Accounts' toggle")
  async clickHideEmptyTokenAccountsToggle() {
    await this.hideEmptyTokenAccountsToggle.click();
  }

  @step("Open Ledger Sync Manager")
  async openManageLedgerSync() {
    await this.manageLedgerSyncButton.click();
  }

  @step("Clear cache")
  async clearCache() {
    await this.clearCacheButton.click();
    await this.confirmButton.click();
  }

  @step("expect Ledger Support URL to be correct")
  async expectLedgerSupportUrlToBeCorrect() {
    await expect(this.ledgerSupport).toBeVisible();
    const url = await this.ledgerSupport.getAttribute("href");
    if (!url) {
      throw new Error("The href attribute is missing or null");
    }
    try {
      const response = await axios.get(url);
      expect(response.status).toBe(200);
    } catch (error) {
      throw new Error(`Failed to fetch URL ${url}`);
    }
    expect(url).toBe("https://support.ledger.com");
  }

  @step("Reset App")
  async resetApp() {
    await this.resetAppButton.click();
  }
}
