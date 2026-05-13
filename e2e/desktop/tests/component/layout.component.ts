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
  readonly drawerDiscoverButton = this.page.getByTestId("drawer-catalog-button");
  readonly drawerReferButton = this.page.getByTestId("drawer-refer-button");
  readonly drawerCardButton = this.page.getByTestId("drawer-card-button");

  // topbar
  readonly topbarSynchronizeButton = this.topbarActionButton("synchronize").or(
    this.page.getByTestId("topbar-synchronize-button"),
  );
  readonly topbarNotificationButton = this.topbarActionButton("notifications").or(
    this.page.getByTestId("topbar-notification-button"),
  );
  readonly topbarSettingsButton = this.topbarActionButton("settings").or(
    this.page.getByTestId("topbar-settings-button"),
  );
  readonly topbarMyLedgerButton = this.topbarActionButton("my-ledger");

  @step("Go to Portfolio")
  async goToPortfolio() {
    await this.drawerPortfolioButton.click();
  }

  @step("Navigate to Market")
  async goToMarket() {
    await this.drawerMarketButton.click();
  }

  @step("Open send modal")
  async openSendModalFromSideBar() {
    await this.drawerSendButton.click();
  }

  @step("Go to buy crypto")
  async goToBuySellCrypto() {
    await this.drawerBuycryptoButton.click();
  }

  @step("Go to Settings")
  async goToSettings() {
    await this.topbarSettingsButton.click();
  }

  @step("synchronize accounts")
  async syncAccounts() {
    await this.topbarSynchronizeButton.click();
  }

  @step("Synchronize accounts if available")
  async syncAccountsIfAvailable() {
    if (await this.topbarSynchronizeButton.isEnabled()) {
      await this.syncAccounts();
    }
  }

  @step("Wait for accounts sync to be finished")
  async waitForAccountsSyncToBeDone() {
    await expect(this.topbarSynchronizeButton).not.toHaveText("Synchronizing");
  }

  @step("Wait for accounts sync to be finished")
  async waitForSyncButtonToBeEnabled() {
    await expect(this.topbarSynchronizeButton).not.toHaveAttribute("disabled");
  }

  @step("Expect buy/sell sidebar to be selected")
  async verifyBuySellSideBarIsSelected() {
    await expect(this.drawerBuycryptoButton).toHaveAttribute("data-active", "true");
  }
}
