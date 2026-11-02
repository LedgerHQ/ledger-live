import { Step } from "jest-allure2-reporter/api";
import { byId } from "@e2e/helpers/elements/native";

export default class MyWalletPage {
  private readonly contactsButton = byId("my-wallet-contacts-button");
  private readonly quickActionHelp = byId("my-wallet-quick-action-help");
  private readonly headerSettingsButton = byId("my-wallet-header-settings-button");
  private readonly headerNotificationsButton = byId("my-wallet-header-notifications-button");
  private readonly headerBackButton = byId("navigation-header-back-button");
  private readonly helpScreen = byId("my-wallet-help-screen");
  private readonly settingsScreen = byId("general-settings-card");

  @Step("Expect My Wallet screen visible")
  async expectScreenVisible() {
    await this.headerSettingsButton.waitVisible();
  }

  // Composes the Contacts page's own arrival assertion rather than duplicating its locator.
  @Step("Open Contacts")
  async openContacts() {
    await this.contactsButton.tap();
    await app.contacts.expectScreenVisible();
  }

  @Step("Tap Help quick action")
  async tapHelp() {
    await this.quickActionHelp.tap();
  }

  @Step("Tap header Settings button")
  async tapHeaderSettings() {
    await this.headerSettingsButton.tap();
  }

  @Step("Tap header Notifications button")
  async tapHeaderNotifications() {
    await this.headerNotificationsButton.tap();
  }

  @Step("Tap header back button to leave My Wallet")
  async tapHeaderBack() {
    await this.headerBackButton.tap();
  }

  @Step("Expect Help screen visible")
  async expectHelpScreenVisible() {
    await this.helpScreen.waitVisible();
  }

  @Step("Expect Settings screen visible")
  async expectSettingsScreenVisible() {
    await this.settingsScreen.waitVisible();
  }
}
