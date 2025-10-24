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
    const password = this.passwordSettingsSwitch();
    await password.tap();
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

  @Step("Click on Countervalue Settings Row")
  async clickOnCountervalueSettingsRow() {
    await waitForElementById(this.countervalueSettingsRowId);
    await tapById(this.countervalueSettingsRowId);
  }

  @Step("Change counter value to $0")
  async changeCounterValue(currency: string) {
    await this.clickOnCountervalueSettingsRow();
    await scrollToId(this.compactSettingsRowId(currency), this.counterValueSettingsFlatListId);
    await tapById(this.compactSettingsRowId(currency));
  }

  @Step("Expect counter value to be $0")
  async expectCounterValue(currency: string) {
    await waitForElementById(this.countervalueTickerSettingsRowId);
    await detoxExpect(getElementById(this.countervalueTickerSettingsRowId)).toHaveText(currency);
  }
}
