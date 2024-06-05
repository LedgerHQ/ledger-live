import { step } from "../misc/reporters/step";
import { Component } from "tests/page/abstractClasses";

export class Layout extends Component {
  readonly renderError = this.page.locator("data-test-id=render-error");
  readonly appVersion = this.page.locator("data-test-id=app-version");

  // portfolio && accounts
  readonly totalBalance = this.page.locator("data-test-id=total-balance");

  // drawer
  readonly drawerCollapseButton = this.page.locator("data-test-id=drawer-collapse-button");
  readonly drawerPortfolioButton = this.page.locator("data-test-id=drawer-dashboard-button");
  private drawerMarketButton = this.page.locator("data-test-id=drawer-market-button");
  private drawerAccountsButton = this.page.locator("data-test-id=drawer-accounts-button");
  private drawerDiscoverButton = this.page.locator("data-test-id=drawer-catalog-button");
  private drawerSendButton = this.page.locator("data-test-id=drawer-send-button");
  private drawerReceiveButton = this.page.locator("data-test-id=drawer-receive-button");
  private drawerManagerButton = this.page.locator("data-test-id=drawer-manager-button");
  private drawerBuycryptoButton = this.page.locator("data-test-id=drawer-exchange-button");
  private drawerEarnButton = this.page.locator("data-test-id=drawer-earn-button");
  readonly drawerExperimentalButton = this.page.locator("data-test-id=drawer-experimental-button");
  private bookmarkedAccountsList = this.page.locator("data-test-id=drawer-bookmarked-accounts");
  readonly bookmarkedAccounts = this.bookmarkedAccountsList.locator(".bookmarked-account-item");

  // topbar
  private topbarDiscreetButton = this.page.locator("data-test-id=topbar-discreet-button");
  readonly topbarSynchronizeButton = this.page.locator("data-test-id=topbar-synchronize-button");
  private topbarSettingsButton = this.page.locator("data-test-id=topbar-settings-button");
  readonly topbarLockButton = this.page.locator("data-test-id=topbar-password-lock-button");
  readonly topbarHelpButton = this.page.locator("data-test-id=topbar-help-button");
  private discreetTooltip = this.page.locator("#tippy-12"); // automatically generated tippy id but it's consistent

  // general
  readonly inputError = this.page.locator("id=input-error"); // no data-test-id because css style is applied
  private loadingSpinner = this.page.locator("data-test-id=loading-spinner");
  readonly logo = this.page.locator("data-test-id=logo");

  // updater
  readonly appUpdateBanner = this.page.locator("data-test-id=layout-app-update-banner");
  // }

  @step("Go to Portfolio")
  async goToPortfolio() {
    await this.drawerPortfolioButton.click();
  }

  async goToMarket() {
    await this.drawerMarketButton.click();
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

  async goToManager() {
    await this.drawerManagerButton.click();
  }

  async goToBuyCrypto() {
    await this.drawerBuycryptoButton.click();
  }

  async goToEarn() {
    await this.drawerEarnButton.click();
  }

  async toggleDiscreetMode() {
    await this.topbarDiscreetButton.click();
    await this.discreetTooltip.waitFor({ state: "hidden" }); // makes sure the tooltip has disappeared to prevent flakiness
  }

  async goToSettings() {
    await this.topbarSettingsButton.click();
  }

  async lockApp() {
    await this.topbarLockButton.click();
  }

  async openSendModal() {
    await this.drawerSendButton.click();
  }

  async openReceiveModal() {
    await this.drawerReceiveButton.click();
  }

  async waitForLoadingSpinnerToHaveDisappeared() {
    await this.loadingSpinner.waitFor({ state: "detached" });
  }
}
