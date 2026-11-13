import { Step } from "jest-allure2-reporter/api";
import { openDeeplink } from "@e2e/helpers/commonHelpers";
import { byId, byText } from "@e2e/helpers/elements/native";
import { TIMEOUT } from "@e2e/utils/timeouts";

type Wallet40TabName = "home" | "swap" | "earn" | "card" | "paytab";

export default class MainNavigationPage {
  // --- Wallet 4.0 bottom tabs ---
  private readonly wallet40Tab = (tabName: Wallet40TabName) => byId(`w40-tab-${tabName}`);

  // --- Wallet 4.0 top bar buttons ---
  private readonly topBarDiscover = byId("topbar-discover");
  private readonly topBarMyWallet = byId("topbar-mywallet");
  private readonly topBarTransactionHistory = byId("topbar-transaction-history");
  private readonly myWalletHeaderSettingsButton = byId("my-wallet-header-settings-button");

  // --- Legacy bottom tabs ---
  private readonly legacyTransferButton = byId("transfer-button");
  private readonly legacyMyLedgerTab = byId("TabBarManager");

  // --- Destination page verification ---
  private readonly portfolioScreen = byId("portfolio-screen");
  private readonly earnScreen = byId("earn-screen");
  private readonly cardLandingTitle = byId("card-landing-title");
  // The Discover and Notifications headers have no testID.
  private readonly discoverHeaderTitle = byText("Discover");
  private readonly notificationsHeaderTitle = byText("Notifications");

  // =====================
  // Wait helpers
  // =====================

  @Step("Wait for Wallet 4.0 navigation to be ready")
  async waitForWallet40Ready(timeout = TIMEOUT.xxlarge) {
    await this.topBarDiscover.waitVisible(timeout);
  }

  // =====================
  // Wallet 4.0 Tab Actions
  // =====================

  @Step("Tap W40 tab {{{0}}}")
  async tapWallet40Tab(tabName: Wallet40TabName) {
    await this.wallet40Tab(tabName).tap();
  }

  // =====================
  // Wallet 4.0 Top Bar Actions
  // =====================

  @Step("Tap My Wallet avatar in top bar")
  async tapTopBarMyWallet() {
    await this.topBarMyWallet.tap();
  }

  // The top bar belongs to the navigation chrome, the arrival check to My Wallet — so this composes
  // that page's own assertion instead of duplicating its locator.
  @Step("Open My Wallet from top bar")
  async openMyWallet() {
    await this.tapTopBarMyWallet();
    await app.myWallet.expectScreenVisible();
  }

  @Step("Tap Discover in top bar")
  async tapTopBarDiscover() {
    await this.topBarDiscover.tap();
  }

  @Step("Tap Transaction History in top bar")
  async tapTopBarTransactionHistory() {
    await this.topBarTransactionHistory.tap();
  }

  @Step("Navigate to Settings")
  async navigateToSettings() {
    await this.topBarMyWallet.tap();
    await this.myWalletHeaderSettingsButton.tap();
  }

  // =====================
  // Wallet 4.0 Expectations
  // =====================

  @Step("Expect Wallet 4.0 bottom tabs to be visible")
  async expectWallet40BottomTabsVisible() {
    await this.wallet40Tab("home").expectVisible();
    await this.wallet40Tab("swap").expectVisible();
    await this.wallet40Tab("earn").expectVisible();
    await this.wallet40Tab("card").expectVisible();
  }

  @Step("Expect Wallet 4.0 top bar to be visible")
  async expectWallet40TopBarVisible() {
    await this.topBarMyWallet.expectVisible();
    await this.topBarDiscover.expectVisible();
    await this.topBarTransactionHistory.expectVisible();
  }

  @Step("Expect legacy bottom tabs NOT visible")
  async expectLegacyTabsNotVisible() {
    await this.legacyTransferButton.expectNotVisible();
    await this.legacyMyLedgerTab.expectNotVisible();
  }

  // =====================
  // Destination Page Expectations
  // =====================

  @Step("Open Portfolio via deeplink (W40)")
  async openPortfolioViaDeeplink(timeout = TIMEOUT.xxlarge) {
    await openDeeplink("portfolio");
    await this.waitForWallet40Ready(timeout);
  }

  @Step("Expect Portfolio page visible")
  async expectPortfolioPageVisible() {
    await this.portfolioScreen.waitVisible();
    await this.portfolioScreen.expectVisible();
  }

  @Step("Expect Earn page visible")
  async expectEarnPageVisible() {
    await this.earnScreen.waitVisible();
    await this.earnScreen.expectVisible();
  }

  @Step("Expect Card page visible")
  async expectCardPageVisible() {
    await this.cardLandingTitle.waitVisible();
    await this.cardLandingTitle.expectVisible();
  }

  @Step("Expect Discover page visible")
  async expectDiscoverPageVisible() {
    await this.discoverHeaderTitle.expectVisible();
  }

  @Step("Expect Notifications page visible")
  async expectNotificationsPageVisible() {
    await this.notificationsHeaderTitle.expectVisible();
  }
}
