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

  togglePassword() {
    return this.passwordSettingsSwitch().atIndex(0).tap();
  }

  enterNewPassword(passwordText: string) {
    return this.passwordTextInput().typeText(passwordText);
  }

  confirm() {
    return tapByElement(this.confirmButton());
  }

  navigateToLanguageSelect() {
    return tapByElement(this.enterLanguageMenuButton());
  }

  async selectLanguage(lang: string) {
    await scrollToText(lang, "scrollView-language-change");
    await tapByText(lang);
  }
}
