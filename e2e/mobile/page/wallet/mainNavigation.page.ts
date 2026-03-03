import { element, by } from "detox";
import { Step } from "jest-allure2-reporter/api";
import { openDeeplink } from "../../helpers/commonHelpers";

type Wallet40TabName = "home" | "swap" | "earn" | "card";

export default class MainNavigationPage {
  // --- Wallet 4.0 bottom tabs ---
  wallet40Tab = (tabName: Wallet40TabName) => element(by.id(`w40-tab-${tabName}`));

  // --- Wallet 4.0 top bar buttons ---
  topBarMyLedgerId = "topbar-myledger";
  topBarDiscoverId = "topbar-discover";
  topBarNotificationsId = "topbar-notifications";
  topBarSettingsId = "topbar-settings";

  // --- Legacy bottom tabs ---
  legacyPortfolioTabId = "tab-bar-portfolio";
  legacyEarnTabId = "tab-bar-earn";
  legacyTransferButtonId = "transfer-button";
  legacyDiscoverTabId = "tab-bar-discover";
  legacyMyLedgerTabId = "TabBarManager";

  // --- Destination page verification IDs ---
  portfolioScreenId = "portfolio-screen";
  swapFormId = "swap-form-tab";
  earnScreenId = "earn-screen";
  cardScreenId = "card-landing-screen";
  managerHeaderTitle = "My Ledger";
  discoverHeaderTitle = "Discover";
  notificationsHeaderTitle = "Notifications";
  settingsCardId = "general-settings-card";

  // =====================
  // Wait helpers
  // =====================

  @Step("Wait for Wallet 4.0 navigation to be ready")
  async waitForWallet40Ready() {
    await waitForElementById(this.topBarSettingsId);
  }

  @Step("Wait for Legacy navigation to be ready")
  async waitForLegacyReady() {
    await waitForElementById(this.legacyMyLedgerTabId);
  }

  // =====================
  // Wallet 4.0 Tab Actions
  // =====================

  @Step("Tap W40 tab")
  async tapWallet40Tab(tabName: Wallet40TabName) {
    await this.wallet40Tab(tabName).tap();
  }

  // =====================
  // Wallet 4.0 Top Bar Actions
  // =====================

  @Step("Tap My Ledger in top bar")
  async tapTopBarMyLedger() {
    await tapById(this.topBarMyLedgerId);
  }

  @Step("Tap Discover in top bar")
  async tapTopBarDiscover() {
    await tapById(this.topBarDiscoverId);
  }

  @Step("Tap Notifications in top bar")
  async tapTopBarNotifications() {
    await tapById(this.topBarNotificationsId);
  }

  @Step("Tap Settings in top bar")
  async tapTopBarSettings() {
    await tapById(this.topBarSettingsId);
  }

  // =====================
  // Legacy Tab Actions
  // =====================

  @Step("Tap Portfolio tab (Legacy)")
  async tapLegacyPortfolioTab() {
    await tapById(this.legacyPortfolioTabId);
  }

  @Step("Tap Earn tab (Legacy)")
  async tapLegacyEarnTab() {
    await tapById(this.legacyEarnTabId);
  }

  @Step("Tap Discover tab (Legacy)")
  async tapLegacyDiscoverTab() {
    await tapById(this.legacyDiscoverTabId);
  }

  @Step("Tap My Ledger tab (Legacy)")
  async tapLegacyMyLedgerTab() {
    await tapById(this.legacyMyLedgerTabId);
  }

  // =====================
  // Wallet 4.0 Expectations
  // =====================

  @Step("Expect Wallet 4.0 bottom tabs to be visible")
  async expectWallet40BottomTabsVisible() {
    await detoxExpect(this.wallet40Tab("home")).toBeVisible();
    await detoxExpect(this.wallet40Tab("swap")).toBeVisible();
    await detoxExpect(this.wallet40Tab("earn")).toBeVisible();
    await detoxExpect(this.wallet40Tab("card")).toBeVisible();
  }

  @Step("Expect Wallet 4.0 top bar to be visible")
  async expectWallet40TopBarVisible() {
    await detoxExpect(getElementById(this.topBarMyLedgerId)).toBeVisible();
    await detoxExpect(getElementById(this.topBarDiscoverId)).toBeVisible();
    await detoxExpect(getElementById(this.topBarNotificationsId)).toBeVisible();
    await detoxExpect(getElementById(this.topBarSettingsId)).toBeVisible();
  }

  @Step("Expect legacy bottom tabs NOT visible")
  async expectLegacyTabsNotVisible() {
    await detoxExpect(getElementById(this.legacyTransferButtonId)).not.toBeVisible();
    await detoxExpect(getElementById(this.legacyMyLedgerTabId)).not.toBeVisible();
  }

  // =====================
  // Legacy Expectations
  // =====================

  @Step("Expect legacy bottom tabs to be visible")
  async expectLegacyBottomTabsVisible() {
    await detoxExpect(getElementById(this.legacyPortfolioTabId)).toBeVisible();
    await detoxExpect(getElementById(this.legacyEarnTabId)).toBeVisible();
    await detoxExpect(getElementById(this.legacyTransferButtonId)).toBeVisible();
    await detoxExpect(getElementById(this.legacyDiscoverTabId)).toBeVisible();
    await detoxExpect(getElementById(this.legacyMyLedgerTabId)).toBeVisible();
  }

  @Step("Expect Wallet 4.0 top bar NOT visible")
  async expectWallet40TopBarNotVisible() {
    await detoxExpect(getElementById(this.topBarMyLedgerId)).not.toBeVisible();
  }

  // =====================
  // Destination Page Expectations
  // =====================

  @Step("Open Portfolio via deeplink (W40)")
  async openPortfolioViaDeeplink() {
    await openDeeplink("portfolio");
    await this.waitForWallet40Ready();
  }

  @Step("Expect Portfolio page visible")
  async expectPortfolioPageVisible() {
    await waitForElementById(this.portfolioScreenId);
  }

  @Step("Expect Swap page visible")
  async expectSwapPageVisible() {
    await waitForElementById(this.swapFormId);
  }

  @Step("Expect Earn page visible")
  async expectEarnPageVisible() {
    await waitForElementById(this.earnScreenId);
  }

  @Step("Expect Card page visible")
  async expectCardPageVisible() {
    await waitForElementById(this.cardScreenId);
  }

  @Step("Expect My Ledger page visible")
  async expectMyLedgerPageVisible() {
    await detoxExpect(element(by.text(this.managerHeaderTitle)).atIndex(0)).toBeVisible();
  }

  @Step("Go back via header back button")
  async tapHeaderBackButton() {
    await tapById("header-back-button");
  }

  @Step("Expect Discover page visible")
  async expectDiscoverPageVisible() {
    await detoxExpect(element(by.text(this.discoverHeaderTitle)).atIndex(0)).toBeVisible();
  }

  @Step("Expect Notifications page visible")
  async expectNotificationsPageVisible() {
    await detoxExpect(element(by.text(this.notificationsHeaderTitle)).atIndex(0)).toBeVisible();
  }

  @Step("Expect Settings page visible")
  async expectSettingsPageVisible() {
    await waitForElementById(this.settingsCardId);
  }
}
