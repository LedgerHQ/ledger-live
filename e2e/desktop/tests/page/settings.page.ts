import { AppPage } from "./abstractClasses";
import { step } from "../misc/reporters/step";
import { expect } from "@playwright/test";
import axios from "axios";
import * as path from "path";
import { FileUtils } from "../utils/fileUtils";
import { mkdir, rename } from "fs/promises";

export class SettingsPage extends AppPage {
  private manageLedgerSyncButton = this.page.getByRole("button", { name: "Manage" });
  private clearCacheButton = this.page.getByRole("button", { name: "Clear" });
  private confirmButton = this.page.getByRole("button", { name: "Confirm" });
  private accountsTab = this.page.getByTestId("settings-accounts-tab");
  private helpTab = this.page.getByTestId("settings-help-tab");
  private ledgerSupport = this.page.getByTestId("ledgerSupport-link");
  private resetAppButton = this.page.getByTestId("reset-button");
  private viewUserDataButton = this.page.getByTestId("view-user-data-button");
  private exportLogsButton = this.page.getByTestId("export-logs-button");

  readonly counterValueSelector = this.page.locator(
    "[data-testid='setting-countervalue-dropDown'] .select__value-container",
  );
  private counterValueSearchBar = this.page.locator('[placeholder="Search"]');
  private counterValueDropdownChoiceEuro = this.page.locator(".select__option");
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

  @step("Go to Settings Help tab")
  async goToHelpTab() {
    await this.helpTab.click();
  }

  @step("Change counter value to $0")
  async changeCounterValue(currency: string) {
    await this.counterValueSelector.click();
    await this.counterValueSearchBar.fill(currency);
    await this.counterValueDropdownChoiceEuro.click();
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
    } catch {
      throw new Error(`Failed to fetch URL ${url}`);
    }
    expect(url).toBe("https://support.ledger.com");
  }

  @step("Reset App")
  async resetApp() {
    await this.resetAppButton.click();
  }

  @step("check View User Data button is enabled")
  async checkViewUserDataButtonIsEnabled() {
    await expect(this.viewUserDataButton).toBeEnabled();
  }

  @step("Click on export logs")
  async clickExportLogs() {
    await this.exportLogsButton.click();

    const originalFilePath = path.resolve("./ledgerwallet-logs.txt");
    const targetFilePath = path.resolve(__dirname, "../artifacts/ledgerwallet-logs.txt");

    const fileExists = await FileUtils.waitForFileToExist(originalFilePath, 5000);
    expect(fileExists).toBeTruthy();

    const targetDir = path.dirname(targetFilePath);
    await mkdir(targetDir, { recursive: true });
    await rename(originalFilePath, targetFilePath);
  }
}
