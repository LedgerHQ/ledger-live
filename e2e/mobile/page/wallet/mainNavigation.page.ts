import { element, by } from "detox";
import { Step } from "jest-allure2-reporter/api";
import { openDeeplink, isAndroid } from "@e2e/helpers/commonHelpers";
import { retryUntilTimeout } from "@e2e/utils/retry";
import { isMyWalletEnabled } from "@e2e/utils/initUtil";
import {
  ANALYTICS_CONSENT_DRAWER_ID,
  ANALYTICS_CONSENT_REFUSE_ALL_BUTTON_ID,
} from "@e2e/page/drawer/wallet40Drawers.drawer";

type Wallet40TabName = "home" | "swap" | "earn" | "card";

export default class MainNavigationPage {
  // --- Wallet 4.0 bottom tabs ---
  wallet40Tab = (tabName: Wallet40TabName) => element(by.id(`w40-tab-${tabName}`));

  // --- Wallet 4.0 top bar buttons ---
  topBarDiscoverId = "topbar-discover";
  topBarMyWalletId = "topbar-mywallet";
  topBarMyLedgerId = "topbar-myledger";
  topBarSettingsId = "topbar-settings";
  topBarNotificationsId = "topbar-notifications";
  topBarTransactionHistoryId = "topbar-transaction-history";
  myWalletHeaderSettingsButtonId = "my-wallet-header-settings-button";

  // --- Legacy bottom tabs ---
  legacyTransferButtonId = "transfer-button";
  legacyMyLedgerTabId = "TabBarManager";

  // --- Destination page verification IDs ---
  portfolioScreenId = "portfolio-screen";
  earnScreenId = "earn-screen";
  cardScreenId = "card-landing-screen";
  discoverHeaderTitle = "Discover";
  notificationsHeaderTitle = "Notifications";

  // =====================
  // Wait helpers
  // =====================

  @Step("Wait for Wallet 4.0 navigation to be ready")
  async waitForWallet40Ready(timeout = 60000) {
    await retryUntilTimeout(
      async () => {
        if (isAndroid() && (await IsIdVisible(ANALYTICS_CONSENT_DRAWER_ID, 500))) {
          if (await IsIdVisible(ANALYTICS_CONSENT_REFUSE_ALL_BUTTON_ID, 1000)) {
            await tapById(ANALYTICS_CONSENT_REFUSE_ALL_BUTTON_ID);
          }
          throw new Error("analytics consent drawer still present");
        }
        if (!(await IsIdVisible(this.topBarDiscoverId, 500))) {
          throw new Error(`"${this.topBarDiscoverId}" not visible yet`);
        }
      },
      timeout,
      600,
    );
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
    await tapById(this.topBarMyWalletId);
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
    await tapById(this.topBarDiscoverId);
  }

  @Step("Tap Transaction History in top bar")
  async tapTopBarTransactionHistory() {
    await tapById(this.topBarTransactionHistoryId);
  }

  @Step("Navigate to Settings")
  async navigateToSettings() {
    if (isMyWalletEnabled) {
      await tapById(this.topBarMyWalletId);
      await tapById(this.myWalletHeaderSettingsButtonId);
    } else {
      await tapById(this.topBarSettingsId);
    }
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
    if (isMyWalletEnabled) {
      await detoxExpect(getElementById(this.topBarMyWalletId)).toBeVisible();
    } else {
      await detoxExpect(getElementById(this.topBarMyLedgerId)).toBeVisible();
      await detoxExpect(getElementById(this.topBarNotificationsId)).toBeVisible();
      await detoxExpect(getElementById(this.topBarSettingsId)).toBeVisible();
    }
    await detoxExpect(getElementById(this.topBarDiscoverId)).toBeVisible();
    await detoxExpect(getElementById(this.topBarTransactionHistoryId)).toBeVisible();
  }

  @Step("Expect legacy bottom tabs NOT visible")
  async expectLegacyTabsNotVisible() {
    await detoxExpect(getElementById(this.legacyTransferButtonId)).not.toBeVisible();
    await detoxExpect(getElementById(this.legacyMyLedgerTabId)).not.toBeVisible();
  }

  // =====================
  // Destination Page Expectations
  // =====================

  @Step("Open Portfolio via deeplink (W40)")
  async openPortfolioViaDeeplink(timeout = 60000) {
    await openDeeplink("portfolio");
    await this.waitForWallet40Ready(timeout);
  }

  @Step("Expect Portfolio page visible")
  async expectPortfolioPageVisible() {
    await waitForElementById(this.portfolioScreenId);
  }

  @Step("Expect Earn page visible")
  async expectEarnPageVisible() {
    await waitForElementById(this.earnScreenId);
  }

  @Step("Expect Card page visible")
  async expectCardPageVisible() {
    await waitForElementById(this.cardScreenId);
  }

  @Step("Expect Discover page visible")
  async expectDiscoverPageVisible() {
    await detoxExpect(element(by.text(this.discoverHeaderTitle)).atIndex(0)).toBeVisible();
  }

  @Step("Expect Notifications page visible")
  async expectNotificationsPageVisible() {
    await detoxExpect(element(by.text(this.notificationsHeaderTitle)).atIndex(0)).toBeVisible();
  }
}
