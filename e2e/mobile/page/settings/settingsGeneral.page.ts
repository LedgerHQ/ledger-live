import { expect } from "detox";

export default class SettingsGeneralPage {
  passwordSettingsSwitch = () => getElementById("password-settings-switch");
  passwordTextInput = () => getElementById("password-text-input");
  preferredCurrencyButton = () => getElementByText("Preferred currency");
  enterLanguageMenuButton = () => getElementById("language-button");
  enterLedgerSync = () => getElementById("wallet-sync-button");
  localizedText = (text: string) => getElementByText(text);

  @Step("Toggle password")
  async togglePassword() {
    const password = await this.passwordSettingsSwitch();
    await password.tap();
  }

  @Step("Enter new password")
  async enterNewPassword(passwordText: string) {
    await typeTextByElement(await this.passwordTextInput(), passwordText);
  }

  @Step("Navigate to language select")
  async navigateToLanguageSelect() {
    await tapByElement(await this.enterLanguageMenuButton());
  }

  @Step("Go to Ledger Sync")
  async navigateToLedgerSync() {
    await tapByElement(await this.enterLedgerSync());
  }

  @Step("Select language")
  async selectLanguage(lang: string) {
    await scrollToText(lang);
    await tapByText(lang);
  }

  @Step("Expect preferred currency button")
  async expectPreferredCurrencyButton() {
    await expect(await this.preferredCurrencyButton()).toBeVisible();
  }

  @Step("Expect localized text")
  async expectLocalizedText(text: string) {
    await expect(await this.localizedText(text)).toBeVisible();
  }
}
