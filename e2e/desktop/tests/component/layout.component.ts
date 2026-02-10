import { expect } from "@playwright/test";
import { step } from "tests/misc/reporters/step";
import { Component } from "tests/page/abstractClasses";

export class Layout extends Component {
  readonly renderError = this.page.getByTestId("render-error");
  readonly appVersion = this.page.getByTestId("app-version");
  private readonly topbarActionButton = (action: string) =>
    this.page.getByTestId(`topbar-action-button-${action}`);

  // side bar
  readonly drawerPortfolioButton = this.page.getByTestId("drawer-dashboard-button");
  readonly drawerMarketButton = this.page.getByTestId("drawer-market-button");
  readonly drawerAccountsButton = this.page.getByTestId("drawer-accounts-button");
  readonly drawerSendButton = this.page.getByTestId("drawer-send-button");
  readonly drawerEarnButton = this.page.getByTestId("drawer-earn-button");
  readonly drawerBuycryptoButton = this.page.getByTestId("drawer-exchange-button");
  readonly drawerSwapButton = this.page.getByTestId("drawer-swap-button");

  // topbar
  readonly topbarSynchronizeButton = this.topbarActionButton("synchronize").or(
    this.page.getByTestId("topbar-synchronize-button"),
  );
  readonly topbarNotificationButton = this.page.getByTestId("topbar-notification-button");
  readonly topbarSettingsButton = this.page.getByTestId("topbar-settings-button");
  readonly topbarDiscreetButton = this.topbarActionButton("discreet").or(
    this.page.getByTestId("topbar-discreet-button"),
  );

  @step("Go to Portfolio")
  async goToPortfolio() {
    await this.drawerPortfolioButton.click();
  }

  @step("Navigate to Market")
  async goToMarket() {
    await this.drawerMarketButton.click();
  }

  @step("Open Accounts")
  async goToAccounts() {
    await this.drawerAccountsButton.click();
  }

  @step("Open send modal")
  async openSendModalFromSideBar() {
    await this.drawerSendButton.click();
  }

  @step("Go to earn")
  async goToEarn() {
    await this.drawerEarnButton.click();
  }

  @step("Go to buy crypto")
  async goToBuySellCrypto() {
    await this.drawerBuycryptoButton.click();
  }

  @step("Go to swap")
  async goToSwap() {
    await this.drawerSwapButton.click();
  }

  @step("Go to Settings")
  async goToSettings() {
    await this.topbarSettingsButton.click();
  }

  @step("synchronize accounts")
  async syncAccounts() {
    await this.topbarSynchronizeButton.click();
  }

  @step("toggle discreet mode")
  async toggleDiscreetMode() {
    await this.topbarDiscreetButton.click();
  }

  @step("Wait for accounts sync to be finished")
  async waitForAccountsSyncToBeDone() {
    await expect(this.topbarSynchronizeButton).not.toHaveText("Synchronizing");
  }

  @step("Expect buy/sell sidebar to be selected")
  async verifyBuySellSideBarIsSelected() {
    await expect(this.drawerBuycryptoButton).toHaveAttribute("data-active", "true");
  }
}
