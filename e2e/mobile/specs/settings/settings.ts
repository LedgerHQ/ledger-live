import { device } from "detox";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { ApplicationOptions } from "page";

const liveDataCommand = (currencyApp: { name: string }, index: number) => (userdataPath?: string) =>
  CLI.liveData({
    currency: currencyApp.name,
    index,
    add: true,
    appjson: userdataPath,
  });

async function initApp(options: ApplicationOptions) {
  await app.init({
    userdata: options.userdata,
    cliCommands: options.cliCommands,
    speculosApp: options.speculosApp,
  });
  await app.portfolio.waitForPortfolioPageToLoad();
}

export function runUserClearApplicationCacheTest(
  account: Account,
  tmsLinks: string[],
  tags: string[],
) {
  describe("User clear application cache", () => {
    beforeAll(async () => {
      await initApp({
        userdata: "skip-onboarding",
        cliCommands: [liveDataCommand(account.currency, account.index)],
        speculosApp: account.currency.speculosApp,
      });
    });

    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));

    test("The user can clear application cache", async () => {
      await app.portfolio.tapTabSelector("Accounts");
      const countBeforeClearingCache = await app.portfolio.countAccounts();
      await app.portfolio.navigateToSettings();
      await app.settings.navigateToHelpSettings();
      await app.settingsHelp.clickOnClearCacheRow();
      await app.settingsHelp.checkClearCacheModalIsDisplayed();
      await app.settingsHelp.clickOnClearCacheButton();
      await app.portfolio.waitForPortfolioPageToLoad();
      const countAfterClearingCache = await app.portfolio.countAccounts();
      await app.portfolio.compareAccountsCount(countBeforeClearingCache, countAfterClearingCache);
    });
  });
}

export function runUserCanExportLogsTest(tmsLinks: string[], tags: string[]) {
  describe("User can export logs", () => {
    beforeAll(async () => {
      await initApp({ userdata: "skip-onboarding" });
    });

    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));

    test("Verify that user can export logs", async () => {
      await app.portfolio.navigateToSettings();
      await app.settings.navigateToHelpSettings();
      await app.settingsHelp.clickOnExportLogsRow();
      await app.settingsHelp.verifyLogsAreExported();
    });
  });
}

export function runUserCanAccessLedgerSupportTest(tmsLinks: string[], tags: string[]) {
  describe("User can access Ledger Support (Web Link)", () => {
    beforeAll(async () => {
      await initApp({ userdata: "skip-onboarding" });
    });

    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    test("Verify that user can access Ledger Support (Web Link)", async () => {
      await app.portfolio.navigateToSettings();
      await app.settings.navigateToHelpSettings();
      await app.settingsHelp.expectLedgerSupportUrlToBeCorrect();
    });
  });
}

export function runUserCanSelectCounterValueToDisplayAmountInLedgerLive(
  account: Account,
  tmsLinks: string[],
  tags: string[],
) {
  describe("User can select counter value to display amount in Ledger Live", () => {
    beforeAll(async () => {
      await initApp({
        userdata: "skip-onboarding",
        cliCommands: [liveDataCommand(account.currency, account.index)],
        speculosApp: account.currency.speculosApp,
      });
    });

    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    test("Verify that user can select counter value to display amount in Ledger Live", async () => {
      await app.portfolio.navigateToSettings();
      await app.settings.navigateToGeneralSettings();
      await app.settingsGeneral.changeCounterValue("Euro - EUR");
      await app.settingsGeneral.expectCounterValue("EUR");
      await app.portfolio.openViaDeeplink();
      await app.portfolio.waitForPortfolioPageToLoad();
      await app.portfolio.expectTotalBalanceCounterValue("€");
      await app.portfolio.expectBalanceDiffCounterValue("€");
      await app.portfolio.expectAssetRowCounterValue(account.currency.name, "€");
      await app.portfolio.expectOperationCounterValue("€");
    });
  });
}

async function initPasswordTest() {
  const nanoApp = AppInfos.ETHEREUM;
  await app.init({
    speculosApp: nanoApp,
    cliCommands: [
      async (userdataPath?: string) => {
        return CLI.liveData({
          currency: nanoApp.name,
          index: 0,
          appjson: userdataPath,
          add: true,
        });
      },
    ],
  });
  await app.portfolio.waitForPortfolioPageToLoad();
}

async function setupPasswordAndLock(password: string) {
  await app.portfolio.navigateToSettings();
  await app.settings.navigateToGeneralSettings();
  await app.settingsGeneral.togglePassword();
  await app.settingsGeneral.enterNewPassword(password);
  await app.settingsGeneral.enterNewPassword(password); // confirm password step
  await device.sendToHome();
  await device.launchApp(); // restart LLM
  await app.passwordEntry.expectLock();
}

export function runPasswordUnlockTest(tmsLinks: string[], tags: string[]) {
  const CORRECT_PASSWORD = "passWORD$123!";

  describe("Password Lock Screen - Unlock with correct password", () => {
    beforeAll(async () => {
      await initPasswordTest();
      await setupPasswordAndLock(CORRECT_PASSWORD);
    });

    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it("should unlock with correct password", async () => {
      await app.passwordEntry.enterPassword(CORRECT_PASSWORD);
      await app.passwordEntry.login();
      await app.passwordEntry.expectNoLock();
      await app.settingsGeneral.expectPreferredCurrencyButton();
    });
  });
}

export function runPasswordIncorrectTest(tmsLinks: string[], tags: string[]) {
  const CORRECT_PASSWORD = "passWORD$123!";

  describe("Password Lock Screen - Stay locked with incorrect password", () => {
    beforeAll(async () => {
      await initPasswordTest();
      await setupPasswordAndLock(CORRECT_PASSWORD);
    });

    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it("should stay locked with incorrect password", async () => {
      await app.passwordEntry.enterPassword("INCORRECT_PASSWORD");
      await app.passwordEntry.login();
      await app.passwordEntry.expectLock();
    });
  });
}
