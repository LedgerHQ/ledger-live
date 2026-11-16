import { device } from "detox";
import { Step } from "jest-allure2-reporter/api";
import { delay, escapeRegExp, isAndroid } from "@e2e/helpers/commonHelpers";
import { byId, byIdWithDescendantText, byText } from "@e2e/helpers/elements/native";
import { INTERVAL, TIMEOUT } from "@e2e/utils/timeouts";

const REVAMPED_LOCK_GRACE_MS = INTERVAL.long;

export default class SettingsGeneralPage {
  private readonly passwordSettingsSwitch = byId("password-settings-switch");
  private readonly passwordTextInput = byId("password-text-input");
  private readonly enterLanguageMenuButton = byId("language-button");
  private readonly enterLedgerSync = byId("wallet-sync-button");
  private readonly countervalueSettingsRow = byId("countervalue-settings-row");
  private readonly countervalueTickerSettingsRow = byId("countervalue-ticker-settings-row");
  private readonly counterValueSettingsFlatList = byId("counter-value-settings-flat-list");
  private readonly languageScrollView = byId("scrollView-language-change");
  private readonly localizedText = (text: string) => byText(text);
  private readonly compactSettingsRow = (currencyTicker: string) =>
    byId(`compact-settings-row-${currencyTicker}`);
  // Matches the text anywhere in a descendant of the row, so a longer label still passes.
  private readonly rowContaining = (testId: string, text: RegExp) =>
    byIdWithDescendantText({ id: testId, text: new RegExp(`.*${text.source}.*`, text.flags) });

  @Step("Toggle password")
  async togglePassword() {
    await this.passwordSettingsSwitch.tap();
  }

  @Step("Expect password toggle to be {{{0}}}")
  async expectPasswordToggleValue(value: "ON" | "OFF") {
    const expected = value === "ON";
    await this.passwordSettingsSwitch.expectToggleValue(expected);
  }

  @Step("Enter new password")
  async enterNewPassword(passwordText: string) {
    await this.passwordTextInput.replaceText(passwordText);
  }

  @Step("Navigate to language select")
  async navigateToLanguageSelect() {
    await this.enterLanguageMenuButton.tap();
  }

  @Step("Go to Ledger Sync")
  async navigateToLedgerSync() {
    await this.enterLedgerSync.tap();
  }

  /** The row renders the same id whether or not a backup exists; only its destination changes. */
  @Step("Expect the Ledger Sync entry point to be visible")
  async expectLedgerSyncEntryPoint() {
    await this.enterLedgerSync.waitVisible();
    await this.enterLedgerSync.expectVisible();
  }

  @Step("Select language {{{0}}}")
  async selectLanguage(lang: string) {
    await this.localizedText(lang).scrollTo(this.languageScrollView);
    await this.localizedText(lang).tap();
  }

  @Step("Expect preferred currency button")
  async expectPreferredCurrencyButton() {
    await this.countervalueSettingsRow.expectVisible();
  }

  @Step("Expect localized text {{{0}}}")
  async expectLocalizedText(text: string) {
    await this.localizedText(text).expectVisible();
  }

  @Step("Expect character set {{{1}}} in {{{0}}}")
  async expectCharacterSet(testId: string, pattern: RegExp) {
    await this.rowContaining(testId, pattern).expectVisible();
  }

  @Step("Expect translated row {{{0}}} to be {{{1}}}")
  async expectTranslatedRow(testId: string, expectedText: string) {
    await this.rowContaining(testId, new RegExp(escapeRegExp(expectedText), "i")).expectVisible();
  }

  @Step("Click on Countervalue Settings Row")
  async clickOnCountervalueSettingsRow() {
    await this.countervalueSettingsRow.tap();
  }

  @Step("Change counter value to {{{0}}}")
  async changeCounterValue(currency: string) {
    await this.clickOnCountervalueSettingsRow();
    await this.compactSettingsRow(currency).scrollTo(this.counterValueSettingsFlatList);
    await this.compactSettingsRow(currency).tap();
  }

  @Step("Expect counter value to be {{{0}}}")
  async expectCounterValue(currency: string) {
    await this.countervalueTickerSettingsRow.waitVisible();
    await this.countervalueTickerSettingsRow.expectText(currency);
  }

  @Step("Setup password and lock")
  async setupPasswordAndLock(password: string) {
    await this.expectPasswordToggleValue("OFF");
    await this.togglePassword();
    await this.enterNewPassword(password);
    await this.enterNewPassword(password);
    await this.expectPasswordToggleValue("ON");
    await this.sendToBackgroundAndBack();
  }

  @Step("Set up a revamped password and lock the app")
  async setupRevampedPasswordAndLock(password: string) {
    await app.appLock.choosePassword(password);
    await app.appLock.confirmPassword(password);
    await this.passwordSettingsSwitch.waitVisible(TIMEOUT.medium);
    await this.expectPasswordToggleValue("ON");
    await this.sendToBackgroundAndBack(REVAMPED_LOCK_GRACE_MS);
  }

  private async sendToBackgroundAndBack(awayMs = 0) {
    // Recurring JS timers post-RN-0.81 keep Detox's idle sync from completing during
    // background transitions; opt out around sendToHome/launchApp to avoid the hang.
    await app.common.disableSynchronizationForiOS();
    await device.sendToHome();
    if (awayMs > 0) {
      await delay(awayMs);
    }
    if (isAndroid()) {
      /*
       * delay for android due to state management workaround
       * permalink: https://github.com/LedgerHQ/ledger-live/blob/9a9d649c1175ecf1a884a0ae615dba96b208c374/apps/ledger-live-mobile/src/context/AuthPass/auth.hooks.ts#L54-L61
       * ticket reference: https://ledgerhq.atlassian.net/browse/LIVE-20822
       */
      await delay(INTERVAL.long);
    }
    await device.launchApp({ newInstance: false }); // bring back from background
    await app.common.enableSynchronization();
  }
}
