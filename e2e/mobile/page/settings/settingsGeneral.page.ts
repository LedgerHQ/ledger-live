import { expect } from "detox";

export default class SettingsGeneralPage {
  passwordSettingsSwitch = () => getElementById("password-settings-switch");
  passwordTextInput = () => getElementById("password-text-input");
  preferredCurrencyButton = () => getElementByText("Preferred currency");
  confirmButton = () => getElementByText("Confirm");
  enterLanguageMenuButton = () => getElementById("language-button");
  enterLedgerSync = () => getElementById("wallet-sync-button");
  localizedText = (text: string) => getElementByText(text);

  async togglePassword() {
    const password = await this.passwordSettingsSwitch();
    await password.tap();
  }

  async enterNewPassword(passwordText: string) {
    await typeTextByElement(await this.passwordTextInput(), passwordText);
  }

  async confirm() {
    await tapByElement(await this.confirmButton());
  }

  async navigateToLanguageSelect() {
    await tapByElement(await this.enterLanguageMenuButton());
  }

  @Step("Go to Ledger Sync")
  async navigateToLedgerSync() {
    await tapByElement(await this.enterLedgerSync());
  }

  async selectLanguage(lang: string) {
    await scrollToText(lang);
    await tapByText(lang);
  }

  async expectpreferredCurrencyButton() {
    await expect(await this.preferredCurrencyButton()).toBeVisible();
  }

  async expectLocalizedText(text: string) {
    await expect(await this.localizedText(text)).toBeVisible();
  }
}
