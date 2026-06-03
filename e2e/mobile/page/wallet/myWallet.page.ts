import { Step } from "jest-allure2-reporter/api";

export default class MyWalletPage {
  topBarMyWalletId = "topbar-mywallet";
  avatarId = "my-wallet-avatar";
  quickActionHelpId = "my-wallet-quick-action-help";
  headerSettingsButtonId = "my-wallet-header-settings-button";
  headerNotificationsButtonId = "my-wallet-header-notifications-button";
  headerBackButtonId = "navigation-header-back-button";
  helpScreenId = "my-wallet-help-screen";
  settingsScreenId = "general-settings-card";

  @Step("Open My Wallet from top bar")
  async openFromTopBar() {
    await tapById(this.topBarMyWalletId);
    await this.expectScreenVisible();
  }

  @Step("Expect My Wallet screen visible")
  async expectScreenVisible() {
    await waitForElementById(this.headerSettingsButtonId);
  }

  @Step("Tap Help quick action")
  async tapHelp() {
    await tapById(this.quickActionHelpId);
  }

  @Step("Tap header Settings button")
  async tapHeaderSettings() {
    await tapById(this.headerSettingsButtonId);
  }

  @Step("Tap header Notifications button")
  async tapHeaderNotifications() {
    await tapById(this.headerNotificationsButtonId);
  }

  @Step("Tap header back button to leave My Wallet")
  async tapHeaderBack() {
    await tapById(this.headerBackButtonId);
  }

  @Step("Expect Help screen visible")
  async expectHelpScreenVisible() {
    await waitForElementById(this.helpScreenId);
  }

  @Step("Expect Settings screen visible")
  async expectSettingsScreenVisible() {
    await waitForElementById(this.settingsScreenId);
  }
}
