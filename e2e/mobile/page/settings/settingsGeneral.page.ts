import { device } from "detox";
import { Step } from "jest-allure2-reporter/api";
import { delay, isAndroid } from "../../helpers/commonHelpers";

export default class SettingsGeneralPage {
  passwordSettingsSwitch = () => getElementById("password-settings-switch");
  passwordTextInput = () => getElementById("password-text-input");
  enterLanguageMenuButton = () => getElementById("language-button");
  enterLedgerSync = () => getElementById("wallet-sync-button");
  localizedText = (text: string) => getElementByText(text);

  countervalueSettingsRowId = "countervalue-settings-row";
  countervalueTickerSettingsRowId = "countervalue-ticker-settings-row";
  counterValueSettingsFlatListId = "counter-value-settings-flat-list";
  compactSettingsRowId = (currencyTicker: string) => `compact-settings-row-${currencyTicker}`;

  @Step("Toggle password")
  async togglePassword() {
    await tapByElement(this.passwordSettingsSwitch());
  }

  @Step("Expect password toggle to be $0")
  async expectPasswordToggleValue(value: "ON" | "OFF") {
    const expected = value === "ON";
    await detoxExpect(this.passwordSettingsSwitch()).toHaveToggleValue(expected);
  }

  @Step("Enter new password")
  async enterNewPassword(passwordText: string) {
    await typeTextByElement(this.passwordTextInput(), passwordText);
  }

  @Step("Navigate to language select")
  async navigateToLanguageSelect() {
    await tapByElement(this.enterLanguageMenuButton());
  }

  @Step("Go to Ledger Sync")
  async navigateToLedgerSync() {
    await tapByElement(this.enterLedgerSync());
  }

  @Step("Select language")
  async selectLanguage(lang: string) {
    await scrollToText(lang);
    await tapByText(lang);
  }

  @Step("Expect preferred currency button")
  async expectPreferredCurrencyButton() {
    await detoxExpect(getElementById(this.countervalueSettingsRowId)).toBeVisible();
  }

  @Step("Expect localized text")
  async expectLocalizedText(text: string) {
    await detoxExpect(this.localizedText(text)).toBeVisible();
  }

  @Step("Expect character set")
  async expectCharacterSet(testId: string, pattern: RegExp) {
    const substringPattern = new RegExp(`.*${pattern.source}.*`, pattern.flags);
    await detoxExpect(getElementByIdWithDescendantTexts(testId, substringPattern)).toBeVisible();
  }

  @Step("Expect translated row")
  async expectTranslatedRow(testId: string, expectedText: string) {
    await detoxExpect(getElementByIdWithDescendantTexts(testId, expectedText)).toBeVisible();
  }

  @Step("Click on Countervalue Settings Row")
  async clickOnCountervalueSettingsRow() {
    await waitForElementById(this.countervalueSettingsRowId);
    await tapById(this.countervalueSettingsRowId);
  }

  @Step("Change counter value to $0")
  async changeCounterValue(currency: string) {
    await this.clickOnCountervalueSettingsRow();
    await scrollToId(
      this.compactSettingsRowId(currency),
      this.counterValueSettingsFlatListId,
      2000,
    );
    await tapById(this.compactSettingsRowId(currency));
  }

  @Step("Expect counter value to be $0")
  async expectCounterValue(currency: string) {
    await waitForElementById(this.countervalueTickerSettingsRowId);
    await detoxExpect(getElementById(this.countervalueTickerSettingsRowId)).toHaveText(currency);
  }

  @Step("Setup password and lock")
  async setupPasswordAndLock(password: string) {
    await this.expectPasswordToggleValue("OFF");
    await this.togglePassword();
    await this.enterNewPassword(password);
    await this.enterNewPassword(password);
    await this.expectPasswordToggleValue("ON");
    // Recurring JS timers post-RN-0.81 keep Detox's idle sync from completing during
    // background transitions; opt out around sendToHome/launchApp to avoid the hang.
    await app.common.disableSynchronizationForiOS();
    await device.sendToHome();
    if (isAndroid()) {
      /*
       * delay for android due to state management workaround
       * permalink: https://github.com/LedgerHQ/ledger-live/blob/9a9d649c1175ecf1a884a0ae615dba96b208c374/apps/ledger-live-mobile/src/context/AuthPass/auth.hooks.ts#L54-L61
       * ticket reference: https://ledgerhq.atlassian.net/browse/LIVE-20822
       */
      await delay(2000);
    }
    await device.launchApp({ newInstance: false }); // bring back from background
    await app.common.enableSynchronization();
  }
}
