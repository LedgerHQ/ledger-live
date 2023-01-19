import {
  getElementById,
  getElementByText,
  tapByElement,
  tapByText,
} from "../../helpers";
import { by, waitFor } from "detox";

export default class GeneralSettingsPage {
  getPasswordSettingsSwitch = () => getElementById("password-settings-switch");
  getPasswordTextInput = () => getElementById("password-text-input");
  getPreferredCurrency = () => getElementByText("Preferred currency");
  getConfirm = () => getElementByText("Confirm");
  getEnterLanguageMenu = () => getElementById("language-button");

  language = (lang: string) => getElementByText(lang);
  isEnglish = () => getElementByText("General");
  isLocalized = (localization: string) => getElementByText(localization);

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

  async selectLanguage(lang: string) {
    await waitFor(getElementByText(lang))
      .toBeVisible()
      .whileElement(by.id("scrollView-language-change")) // where some is your ScrollView testID
      .scroll(100, "down");
    await tapByText(lang);
  }
}
