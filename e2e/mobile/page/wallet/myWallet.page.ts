import { Step } from "jest-allure2-reporter/api";

export default class MyWalletPage {
  avatarId = "my-wallet-avatar";
  contactsButtonId = "my-wallet-contacts-button";
  quickActionHelpId = "my-wallet-quick-action-help";
  headerSettingsButtonId = "my-wallet-header-settings-button";
  headerNotificationsButtonId = "my-wallet-header-notifications-button";
  headerBackButtonId = "navigation-header-back-button";
  helpScreenId = "my-wallet-help-screen";
  settingsScreenId = "general-settings-card";

  @Step("Expect My Wallet screen visible")
  async expectScreenVisible() {
    await waitForElementById(this.headerSettingsButtonId);
  }

  // Composes the Contacts page's own arrival assertion rather than duplicating its locator.
  @Step("Open Contacts")
  async openContacts() {
    await tapById(this.contactsButtonId);
    await app.contacts.expectScreenVisible();
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
