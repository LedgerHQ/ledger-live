import { expect } from "@playwright/test";
import { step } from "../misc/reporters/step";
import { Component } from "tests/page/abstractClasses";

export class Layout extends Component {
  readonly renderError = this.page.getByTestId("render-error");
  readonly appVersion = this.page.getByTestId("app-version");

  // side bar
  readonly drawerCollapseButton = this.page.getByTestId("drawer-collapse-button");
  readonly drawerPortfolioButton = this.page.getByTestId("drawer-dashboard-button");
  readonly drawerMarketButton = this.page.getByTestId("drawer-market-button");
  readonly drawerAccountsButton = this.page.getByTestId("drawer-accounts-button");
  readonly drawerDiscoverButton = this.page.getByTestId("drawer-catalog-button");
  readonly drawerSendButton = this.page.getByTestId("drawer-send-button");
  readonly drawerReceiveButton = this.page.getByTestId("drawer-receive-button");
  readonly drawerEarnButton = this.page.getByTestId("drawer-earn-button");
  readonly drawerBuycryptoButton = this.page.getByTestId("drawer-exchange-button");
  readonly drawerExperimentalButton = this.page.getByTestId("drawer-experimental-button");
  readonly drawerManagerButton = this.page.getByTestId("drawer-manager-button");
  readonly drawerRecoverButton = this.page.getByTestId("drawer-recover-button");
  readonly recoverStatusIcon = this.page
    .getByTestId("drawer-recover-button")
    .locator("path")
    .nth(1);

  // topbar
  readonly topbarDiscreetButton = this.page.getByTestId("topbar-discreet-button");
  readonly topbarSynchronizeButton = this.page.getByTestId("topbar-synchronize-button");
  readonly topbarSettingsButton = this.page.getByTestId("topbar-settings-button");
  readonly topbarLockButton = this.page.getByTestId("topbar-password-lock-button");
  readonly topbarHelpButton = this.page.getByTestId("topbar-help-button");
  readonly discreetTooltip = this.page.locator("#tippy-12"); // automatically generated tippy id but it's consistent

  // updater
  readonly appUpdateBanner = this.page.getByTestId("layout-app-update-banner");

  @step("Close side bar")
  async closeSideBar() {
    await this.drawerCollapseButton.click();
  }

  @step("Go to Experimental Features")
  async goToExperimentalFeatures() {
    await this.drawerExperimentalButton.click();
  }

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
    await this.drawerAccountsButton.waitFor({ state: "visible" });
    await this.drawerAccountsButton.click();
  }

  @step("Go to discover")
  async goToDiscover() {
    await this.drawerDiscoverButton.click();
  }

  @step("Open send modal")
  async openSendModalFromSideBar() {
    await this.drawerSendButton.click();
  }

  @step("Open receive modal")
  async openReceiveModalFromSideBar() {
    await this.drawerReceiveButton.click();
  }

  @step("Go to earn")
  async goToEarn() {
    await this.drawerEarnButton.click();
  }

  @step("Go to buy crypto")
  async goToBuySellCrypto() {
    await this.drawerBuycryptoButton.click();
  }

  @step("Go to manager")
  async goToManager() {
    await this.drawerManagerButton.click();
  }

  @step("Go to Settings")
  async goToSettings() {
    await this.topbarSettingsButton.click();
  }

  @step("synchronize accounts")
  async syncAccounts() {
    await this.topbarSynchronizeButton.click();
  }

  @step("Toggle discreet mode")
  async toggleDiscreetMode() {
    await this.topbarDiscreetButton.click();
    await this.discreetTooltip.waitFor({ state: "hidden" }); // makes sure the tooltip has disappeared to prevent flakiness
  }

  @step("Expect top bar lock button to be visible")
  async expectTopBarLockButtonToBeVisible() {
    await expect(this.topbarLockButton).toBeVisible();
  }

  @step("Expect top bar lock button not to be visible")
  async expectTopBarLockButtonNotToBeVisible() {
    await expect(this.topbarLockButton).not.toBeVisible();
  }

  @step("Lock app")
  async lockAppFromTopBar() {
    await this.topbarLockButton.click();
  }

  @step("open Help")
  async openHelp() {
    await this.topbarHelpButton.click();
  }

  @step("Expect recover status icon to be visible")
  async expectRecoverStatusIconToBeVisible(visible: boolean = true) {
    await expect(this.drawerRecoverButton).toBeVisible();
    if (visible) {
      await expect(this.recoverStatusIcon).toBeVisible();
    } else {
      await expect(this.recoverStatusIcon).not.toBeVisible();
    }
  }
}
