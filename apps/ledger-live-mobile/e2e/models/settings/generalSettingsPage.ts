import { getElementById, getElementByText, tapByElement } from "../../helpers";

export default class GeneralSettingsPage {
  getPasswordSettingsSwitch = () => getElementById("password-settings-switch");
  getPasswordTextInput = () => getElementById("password-text-input");
  getPreferredCurrency = () => getElementByText("Preferred currency");
  getConfirm = () => getElementByText("Confirm");
  getEnterLanguageMenu = () => getElementById("language-button");
  frenchButton = () => getElementByText("Français");
  isEnglish = () => getElementByText("General");
  isFrench = () => getElementByText("Général");

  async togglePassword() {
    await this.getPasswordSettingsSwitch().atIndex(0).tap();
  }

  async enterNewPassword(passwordText: string) {
    await this.getPasswordTextInput().typeText(passwordText);
  }

  async confirm() {
    await tapByElement(this.getConfirm());
  }

  async navigateToLanguageSelect() {
    await tapByElement(this.getEnterLanguageMenu());
  }

  async selectFrenchLanguage() {
    await tapByElement(this.frenchButton());
  }
}
