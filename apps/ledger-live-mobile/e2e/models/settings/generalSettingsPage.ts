import {
  getElementById,
  getElementByText,
  tapByElement,
  tapByText,
  scrollToText,
} from "../../helpers";

export default class GeneralSettingsPage {
  passwordSettingsSwitch = () => getElementById("password-settings-switch");
  passwordTextInput = () => getElementById("password-text-input");
  preferredCurrencyButton = () => getElementByText("Preferred currency");
  confirmButton = () => getElementByText("Confirm");
  enterLanguageMenuButton = () => getElementById("language-button");
  isLocalized = (localization: string) => getElementByText(localization);

  async togglePassword() {
    await this.passwordSettingsSwitch().atIndex(0).tap();
  }

  async enterNewPassword(passwordText: string) {
    await this.passwordTextInput().typeText(passwordText);
  }

  async confirm() {
    await tapByElement(this.confirmButton());
  }

  async navigateToLanguageSelect() {
    await tapByElement(this.enterLanguageMenuButton());
  }

  async selectLanguage(lang: string) {
    await scrollToText(lang, "scrollView-language-change");
    await tapByText(lang);
  }
}
