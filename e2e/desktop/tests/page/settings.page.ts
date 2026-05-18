import { AppPage } from "./abstractClasses";
import { step } from "../misc/reporters/step";
import { expect } from "@playwright/test";
import axios from "axios";
import * as path from "path";
import { FileUtils } from "../utils/fileUtils";
import { mkdir, rename } from "fs/promises";

export class SettingsPage extends AppPage {
  private syncWalletSyncButton = this.page.getByTestId("button-sync-walletSync");
  private manageWalletSyncButton = this.page.getByTestId("button-manage-walletSync");
  private readonly turnOnLedgerSyncButton = this.page.getByTestId("button-turn-on-ledger-sync");
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
  readonly languageOptions = this.page.locator("div.select__option");
  readonly generalTab = this.page.getByTestId("settings-display-tab");
  readonly languageRow = this.page.getByTestId("setting-language-dropDown");
  readonly counterValueRow = this.page.getByTestId("setting-countervalue-dropDown");
  readonly themeRow = this.page.getByTestId("setting-theme-dropDown");
  readonly hideEmptyTokenAccountsToggle = this.page.getByTestId("hideEmptyTokenAccounts");

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

  @step("Change language to $0")
  async changeLanguage(languageLabel: string) {
    await this.languageSelector.click();
    await this.languageOptions.filter({ hasText: languageLabel }).click();
  }

  @step("Expect language to be selected: $0")
  async expectLanguageSelected(languageLabel: string) {
    await expect(this.languageSelector).toHaveText(languageLabel);
  }

  @step("Expect General settings tab to show $0")
  async expectGeneralTabLabel(text: string) {
    await expect(this.generalTab).toContainText(text);
  }

  @step("Expect language row title to be $0")
  async expectLanguageRowTranslation(text: string) {
    await expect(this.languageRow).toContainText(text);
  }

  @step("Expect counter value row title to be $0")
  async expectCounterValueRowTranslation(text: string) {
    await expect(this.counterValueRow).toContainText(text);
  }

  @step("Expect theme row title to be $0")
  async expectThemeRowTranslation(text: string) {
    await expect(this.themeRow).toContainText(text);
  }

  @step("Expect counter value row to contain characters matching $0")
  async expectCounterValueRowCharacterSet(regex: RegExp) {
    await expect(this.counterValueRow).toContainText(regex);
  }

  @step("Click 'Hide Empty Token Accounts' toggle")
  async clickHideEmptyTokenAccountsToggle() {
    await this.hideEmptyTokenAccountsToggle.click();
  }

  @step("Open Ledger Sync Manager")
  async openManageLedgerSync() {
    await this.manageWalletSyncButton.click();
  }

  @step("Expect Ledger Sync settings entry point to be visible")
  async expectLedgerSyncSettingsEntryPoint() {
    await expect(this.manageWalletSyncButton.or(this.syncWalletSyncButton)).toBeVisible();
  }

  @step("Enable Wallet Sync")
  async enableWalletSync() {
    if (await this.turnOnLedgerSyncButton.isVisible()) {
      await this.turnOnLedgerSyncButton.click();
    } else if (await this.syncWalletSyncButton.isVisible()) {
      await this.syncWalletSyncButton.click();
    } else {
      await this.manageWalletSyncButton.click();
    }
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
