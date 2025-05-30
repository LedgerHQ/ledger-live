import { expect } from "detox";

export default class SettingsGeneralPage {
  passwordSettingsSwitch = () => getElementById("password-settings-switch");
  passwordTextInput = () => getElementById("password-text-input");
  preferredCurrencyButton = () => getElementByText("Preferred currency");
  enterLanguageMenuButton = () => getElementById("language-button");
  localizedText = (text: string) => getElementByText(text);

  async togglePassword() {
    await this.passwordSettingsSwitch().tap();
  }

  async enterNewPassword(passwordText: string) {
    await typeTextByElement(this.passwordTextInput(), passwordText);
  }

  async navigateToLanguageSelect() {
    await tapByElement(this.enterLanguageMenuButton());
  }

  async selectLanguage(lang: string) {
    await scrollToText(lang);
    await tapByText(lang);
  }

  async expectpreferredCurrencyButton() {
    await expect(this.preferredCurrencyButton()).toBeVisible();
  }

  async expectLocalizedText(text: string) {
    await expect(this.localizedText(text)).toBeVisible();
  }
}
