import { expect } from "@playwright/test";
import { step } from "../misc/reporters/step";
import { Component } from "tests/page/abstractClasses";

export class Layout extends Component {
  readonly renderError = this.page.getByTestId("render-error");
  readonly appVersion = this.page.getByTestId("app-version");

  // portfolio && accounts
  readonly totalBalance = this.page.getByTestId("total-balance");

  // drawer
  readonly drawerCollapseButton = this.page.getByTestId("drawer-collapse-button");
  readonly drawerPortfolioButton = this.page.getByTestId("drawer-dashboard-button");
  private drawerMarketButton = this.page.getByTestId("drawer-market-button");
  private drawerAccountsButton = this.page.getByTestId("drawer-accounts-button");
  private drawerDiscoverButton = this.page.getByTestId("drawer-catalog-button");
  private drawerSendButton = this.page.getByTestId("drawer-send-button");
  private drawerReceiveButton = this.page.getByTestId("drawer-receive-button");
  private drawerManagerButton = this.page.getByTestId("drawer-manager-button");
  private drawerBuycryptoButton = this.page.getByTestId("drawer-exchange-button");
  private drawerEarnButton = this.page.getByTestId("drawer-earn-button");
  private drawerSwapButton = this.page.getByTestId("drawer-swap-button");
  readonly drawerExperimentalButton = this.page.getByTestId("drawer-experimental-button");
  private bookmarkedAccountsList = this.page.getByTestId("drawer-bookmarked-accounts");
  readonly bookmarkedAccounts = this.bookmarkedAccountsList.locator(".bookmarked-account-item");
  readonly inputWarning = this.page.locator("id=input-warning");

  // topbar
  private topbarDiscreetButton = this.page.getByTestId("topbar-discreet-button");
  readonly topbarSynchronizeButton = this.page.getByTestId("topbar-synchronize-button");
  private topbarSettingsButton = this.page.getByTestId("topbar-settings-button");
  readonly topbarLockButton = this.page.getByTestId("topbar-password-lock-button");
  readonly topbarHelpButton = this.page.getByTestId("topbar-help-button");
  private discreetTooltip = this.page.locator("#tippy-12"); // automatically generated tippy id but it's consistent

  // general
  readonly inputError = this.page.locator("id=input-error"); // no data-testid because css style is applied
  readonly insufficientFundsWarning = this.page.getByTestId("insufficient-funds-warning");
  readonly logo = this.page.getByTestId("logo");

  // updater
  readonly appUpdateBanner = this.page.getByTestId("layout-app-update-banner");
  // }

  readonly marketPerformanceWidget = this.page.getByTestId("market-performance-widget");

  @step("Go to Portfolio")
  async goToPortfolio() {
    await this.drawerPortfolioButton.click();
  }

  @step("Navigate to Market")
  async goToMarket() {
    await this.drawerMarketButton.click();
  }

  @step("Check input error state visibibility: $0")
  async checkInputErrorVisibibility(expectedState: "visible" | "hidden") {
    await this.inputError.waitFor({ state: expectedState });
  }

  @step("synchronize accounts")
  async syncAccounts() {
    await this.topbarSynchronizeButton.click();
  }

  @step("Wait for accounts sync to be finished")
  async waitForAccountsSyncToBeDone() {
    await expect(this.topbarSynchronizeButton).not.toHaveText("Synchronizing");
    //todo: remove after https://ledgerhq.atlassian.net/browse/LIVE-14410 is solved
    await this.page.waitForTimeout(5000);
  }

  @step("Open Accounts")
  async goToAccounts() {
    await this.drawerAccountsButton.click();
  }

  @step("Wait for balance to be visible")
  async expectBalanceVisibility() {
    await this.totalBalance.waitFor({ state: "visible" });
  }

  async goToDiscover() {
    await this.drawerDiscoverButton.click();
  }

  @step("Go to manager")
  async goToManager() {
    await this.drawerManagerButton.click();
  }

  @step("Go to buy crypto")
  async goToBuyCrypto() {
    await this.drawerBuycryptoButton.click();
  }

  @step("Go to earn")
  async goToEarn() {
    await this.drawerEarnButton.click();
  }

  async toggleDiscreetMode() {
    await this.topbarDiscreetButton.click();
    await this.discreetTooltip.waitFor({ state: "hidden" }); // makes sure the tooltip has disappeared to prevent flakiness
  }

  @step("Go to Settings")
  async goToSettings() {
    await this.topbarSettingsButton.click();
  }

  @step("Check warning message")
  async checkAmoutWarningMessage(expectedWarningMessage: RegExp) {
    if (expectedWarningMessage !== null) {
      await expect(this.insufficientFundsWarning).toBeVisible();
      const warningText = await this.insufficientFundsWarning.innerText();
      expect(warningText).toMatch(expectedWarningMessage);
    }
  }

  @step("Check warning message")
  async checkInputWarningMessage(expectedWarningMessage: string | null) {
    if (expectedWarningMessage !== null) {
      await expect(this.inputWarning).toBeVisible();
      const warningText = await this.inputWarning.innerText();
      expect(warningText).toMatch(expectedWarningMessage);
    }
  }

  @step("Check if the error message is the same as expected")
  async checkErrorMessage(errorMessage: string | null) {
    if (errorMessage !== null) {
      await this.inputError.waitFor({ state: "visible" });
      const errorText: any = await this.inputError.textContent();
      const normalize = (str: string) => str.replace(/\u00A0/g, " ").trim();
      expect(normalize(errorText)).toEqual(normalize(errorMessage));
    }
  }

  @step("Lock app")
  async lockApp() {
    await this.topbarLockButton.click();
  }

  @step("Open send modal")
  async openSendModal() {
    await this.drawerSendButton.click();
  }

  @step("Open receive modal")
  async openReceiveModal() {
    await this.drawerReceiveButton.click();
  }

  async waitForLoadingSpinnerToHaveDisappeared() {
    await this.loadingSpinner.waitFor({ state: "detached" });
  }

  @step("Go to swap")
  async goToSwap() {
    await this.drawerSwapButton.click();
  }
}
