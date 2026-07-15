import { expect } from "@playwright/test";
import { step } from "../misc/reporters/step";
import { Component } from "tests/page/abstractClasses";

export class Layout extends Component {
  readonly renderError = this.page.getByTestId("render-error");
  readonly appVersion = this.page.getByTestId("app-version");

  private readonly topbarActionButton = (action: string) =>
    this.page.getByTestId(`topbar-action-button-${action}`);
  private readonly sidebarNavigation = this.page.getByTestId("sidebar-navigation");
  private readonly sidebarButton = (name: string | RegExp) =>
    this.sidebarNavigation.getByRole("button", { name });
  private readonly legacyDrawerButton = (testId: string) => this.page.getByTestId(testId);

  // side bar
  readonly drawerCollapseButton = this.sidebarNavigation
    .getByRole("button")
    .last()
    .or(this.legacyDrawerButton("drawer-collapse-button"));
  readonly drawerPortfolioButton = this.sidebarButton("home").or(
    this.legacyDrawerButton("drawer-dashboard-button"),
  );
  readonly drawerMarketButton = this.legacyDrawerButton("drawer-market-button");
  readonly drawerAccountsButton = this.sidebarButton("accounts").or(
    this.legacyDrawerButton("drawer-accounts-button"),
  );
  readonly drawerDiscoverButton = this.sidebarButton("discover").or(
    this.legacyDrawerButton("drawer-catalog-button"),
  );
  readonly drawerSendButton = this.legacyDrawerButton("drawer-send-button");
  readonly drawerReceiveButton = this.legacyDrawerButton("drawer-receive-button");
  readonly drawerEarnButton = this.sidebarButton(/^(earn|stake|yield)$/i).or(
    this.legacyDrawerButton("drawer-earn-button"),
  );
  readonly drawerBuycryptoButton = this.legacyDrawerButton("drawer-exchange-button");
  readonly drawerExperimentalButton = this.topbarActionButton("experimental");
  readonly drawerManagerButton = this.topbarActionButton("my-ledger").or(
    this.legacyDrawerButton("drawer-manager-button"),
  );
  readonly drawerRecoverButton = this.sidebarButton(/recover/i).or(
    this.legacyDrawerButton("drawer-recover-button"),
  );
  readonly recoverStatusIcon = this.drawerRecoverButton.locator("path").nth(1);

  // topbar
  readonly topbarDiscreetButton = this.topbarActionButton("discreet").or(
    this.page.getByTestId("topbar-discreet-button"),
  );
  readonly topbarSynchronizeButton = this.topbarActionButton("synchronize").or(
    this.page.getByTestId("topbar-synchronize-button"),
  );
  readonly topbarSettingsButton = this.topbarActionButton("settings").or(
    this.page.getByTestId("topbar-settings-button"),
  );
  readonly topbarMyLedgerButton = this.topbarActionButton("my-ledger");
  readonly topbarLockButton = this.page.getByTestId("topbar-password-lock-button");
  readonly topbarHelpButton = this.page.getByTestId("topbar-help-button");

  // updater (rendered in Wallet40 TopBar via LLD/features/Updater)
  readonly appUpdateBanner = this.page.getByTestId("updater-top-bar-button");

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
    await this.topbarMyLedgerButton.click();
  }

  @step("Go to Settings")
  async goToSettings() {
    const settingsButton = this.topbarSettingsButton;
    if (await settingsButton.isVisible()) {
      await settingsButton.click();
      return;
    }

    await this.page.getByTestId("my-wallet-avatar").click();
    await settingsButton.click();
  }

  @step("synchronize accounts")
  async syncAccounts() {
    await this.topbarSynchronizeButton.click();
  }

  @step("Toggle discreet mode")
  async toggleDiscreetMode() {
    await this.topbarDiscreetButton.click();
  }

  @step("Expect password lock to be enabled")
  async expectTopBarLockButtonToBeVisible() {
    await expect
      .poll(async () =>
        this.page.evaluate(() => window.ledger.store.getState().application.hasPassword === true),
      )
      .toBe(true);
  }

  @step("Expect password lock to be disabled")
  async expectTopBarLockButtonNotToBeVisible() {
    await expect
      .poll(async () =>
        this.page.evaluate(() => window.ledger.store.getState().application.hasPassword !== true),
      )
      .toBe(true);
  }

  @step("Lock app")
  async lockAppFromTopBar() {
    await this.page.evaluate(() => {
      window.ledger.store.dispatch({
        type: "APPLICATION_SET_DATA",
        payload: { isLocked: true, hasPassword: true },
      });
    });
  }

  @step("open Help")
  async openHelp() {
    await this.goToSettings();
    await this.page.getByTestId("settings-help-tab").click();
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
