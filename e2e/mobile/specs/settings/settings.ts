import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { ApplicationOptions } from "page";

const liveDataCommand = (currencyApp: { name: string }, index: number) => (userdataPath?: string) =>
  CLI.liveData({
    currency: currencyApp.name,
    index,
    add: true,
    appjson: userdataPath,
  });

async function beforeAllFunction(options: ApplicationOptions) {
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
  describe("User clear application cache - LLM", () => {
    beforeAll(async () => {
      await beforeAllFunction({
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
  describe("User can export logs - LLM", () => {
    beforeAll(async () => {
      await beforeAllFunction({
        userdata: "skip-onboarding",
      });
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
  describe("User can access Ledger Support (Web Link) - LLM", () => {
    beforeAll(async () => {
      await beforeAllFunction({
        userdata: "skip-onboarding",
      });
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
  describe("User can select counter value to display amount in Ledger Live - LLM", () => {
    beforeAll(async () => {
      await beforeAllFunction({
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
