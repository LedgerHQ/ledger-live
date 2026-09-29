import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { ApplicationOptions } from "@e2e/page/index";
import { setTeamOwner } from "@e2e/helpers/allure/allure-helper";
import { FF_PASSWORD_REVAMP } from "@e2e/utils/featureFlagUtils";
import type { PartialFeatures } from "@shared/feature-flags";

async function initApp(options: ApplicationOptions) {
  await app.init({
    userdata: options.userdata,
    cliCommands: options.cliCommands,
    speculosApp: options.speculosApp,
    speculosForSetupOnly: true,
  });
  await app.mainNavigation.waitForWallet40Ready();
}

export function runUserClearApplicationCacheTest(
  account: Account,
  tmsLinks: string[],
  tags: string[],
) {
  describe("Settings", () => {
    beforeAll(async () => {
      await initApp({
        userdata: "skip-onboarding",
        cliCommands: [liveDataCommand(account)],
        speculosApp: account.currency.speculosApp,
      });
    });

    setTeamOwner(Team.WALLET_XP);
    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));

    test("Clear the application cache", async () => {
      await app.portfolio.tapTabSelector("Accounts");
      const countBeforeClearingCache = await app.portfolio.countAccounts();
      await app.mainNavigation.navigateToSettings();
      await app.settings.navigateToHelpSettings();
      await app.settingsHelp.clickOnClearCacheRow();
      await app.settingsHelp.checkClearCacheModalIsDisplayed();
      await app.settingsHelp.clickOnClearCacheButton();
      await app.mainNavigation.waitForWallet40Ready();
      const countAfterClearingCache = await app.portfolio.countAccounts();
      await app.portfolio.compareAccountsCount(countBeforeClearingCache, countAfterClearingCache);
    });
  });
}

export function runUserCanExportLogsTest(tmsLinks: string[], tags: string[]) {
  describe("Settings", () => {
    beforeAll(async () => {
      await initApp({ userdata: "skip-onboarding" });
    });

    setTeamOwner(Team.WALLET_XP);
    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));

    test("Export logs", async () => {
      await app.mainNavigation.navigateToSettings();
      await app.settings.navigateToHelpSettings();
      await app.settingsHelp.clickOnExportLogsRow();
      await app.settingsHelp.verifyLogsAreExported();
    });
  });
}

export function runUserCanAccessLedgerSupportTest(tmsLinks: string[], tags: string[]) {
  describe("Settings", () => {
    beforeAll(async () => {
      await initApp({ userdata: "skip-onboarding" });
    });

    setTeamOwner(Team.WALLET_XP);
    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    test("Access Ledger Support web link", async () => {
      await app.mainNavigation.navigateToSettings();
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
  describe("Settings", () => {
    beforeAll(async () => {
      await initApp({
        userdata: "skip-onboarding",
        cliCommands: [liveDataCommand(account)],
        speculosApp: account.currency.speculosApp,
      });
    });

    setTeamOwner(Team.WALLET_XP);
    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    test("Select a counter value to display amounts", async () => {
      await app.mainNavigation.navigateToSettings();
      await app.settings.navigateToGeneralSettings();
      await app.settingsGeneral.changeCounterValue("Euro - EUR");
      await app.settingsGeneral.expectCounterValue("EUR");
      await app.mainNavigation.openPortfolioViaDeeplink();
      await app.portfolio.expectTotalBalanceCounterValue("€");
      await app.portfolio.expectBalanceDiffToBeVisible();
      await app.portfolio.expectAssetRowCounterValue(account.currency.name, "€");
      await app.portfolio.expectOperationCounterValue("€");
    });
  });
}

async function initPasswordTest(featureFlags?: PartialFeatures) {
  const nanoApp = AppInfos.ETHEREUM;
  await app.init({
    speculosApp: nanoApp,
    cliCommands: [liveDataCommand(Account.ETH_1)],
    speculosForSetupOnly: true,
    featureFlags,
  });
  await app.mainNavigation.waitForWallet40Ready();
}

export function runPasswordUnlockTest(tmsLinks: string[], tags: string[]) {
  const CORRECT_PASSWORD = "passWORD$123!";

  describe("Settings", () => {
    beforeAll(async () => {
      await initPasswordTest();
      await app.mainNavigation.navigateToSettings();
      await app.settings.navigateToGeneralSettings();
      await app.settingsGeneral.setupPasswordAndLock(CORRECT_PASSWORD);
      await app.passwordEntry.expectLock();
    });

    setTeamOwner(Team.WALLET_XP);
    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it(`[${Account.ETH_1.currency.testLabel}] - Unlock the app with the correct password`, async () => {
      await app.passwordEntry.enterPassword(CORRECT_PASSWORD);
      await app.passwordEntry.login();
      await app.passwordEntry.expectNoLock();
      await app.settingsGeneral.expectPreferredCurrencyButton();
    });
  });
}

export function runPasswordIncorrectTest(tmsLinks: string[], tags: string[]) {
  const CORRECT_PASSWORD = "passWORD$123!";

  describe("Settings", () => {
    beforeAll(async () => {
      await initPasswordTest();
      await app.mainNavigation.navigateToSettings();
      await app.settings.navigateToGeneralSettings();
      await app.settingsGeneral.setupPasswordAndLock(CORRECT_PASSWORD);
      await app.passwordEntry.expectLock();
    });

    setTeamOwner(Team.WALLET_XP);
    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it("App stays locked with an incorrect password", async () => {
      await app.passwordEntry.enterPassword("INCORRECT_PASSWORD");
      await app.passwordEntry.login();
      await app.passwordEntry.expectLock();
    });
  });
}

export function runRevampedPasswordUnlockTest(tmsLinks: string[], tags: string[]) {
  const CORRECT_PASSWORD = "passWORD$123!";
  const TOO_SHORT_PASSWORD = "pass1";

  describe("Settings", () => {
    beforeAll(async () => {
      await initPasswordTest(FF_PASSWORD_REVAMP);
      await app.mainNavigation.navigateToSettings();
      await app.settings.navigateToGeneralSettings();
      await app.settingsGeneral.expectPasswordToggleValue("OFF");
      await app.settingsGeneral.togglePassword();
    });

    setTeamOwner(Team.WALLET_XP);
    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it("Refuses a password shorter than 6 characters", async () => {
      await app.appLock.choosePassword(TOO_SHORT_PASSWORD);
      await app.appLock.expectPasswordTooShort();
    });

    it("Turns the password on and locks the app once it leaves", async () => {
      await app.settingsGeneral.setupRevampedPasswordAndLock(CORRECT_PASSWORD);
      await app.appLock.expectLock();
    });

    it(`[${Account.ETH_1.currency.testLabel}] - Unlock the app with the correct password`, async () => {
      await app.appLock.enterUnlockPassword(CORRECT_PASSWORD);
      await app.appLock.unlock();
      await app.appLock.expectNoLock();
      await app.settingsGeneral.expectPreferredCurrencyButton();
    });
  });
}

export function runRevampedPasswordIncorrectTest(tmsLinks: string[], tags: string[]) {
  const CORRECT_PASSWORD = "passWORD$123!";

  describe("Settings", () => {
    beforeAll(async () => {
      await initPasswordTest(FF_PASSWORD_REVAMP);
      await app.mainNavigation.navigateToSettings();
      await app.settings.navigateToGeneralSettings();
      await app.settingsGeneral.expectPasswordToggleValue("OFF");
      await app.settingsGeneral.togglePassword();
      await app.settingsGeneral.setupRevampedPasswordAndLock(CORRECT_PASSWORD);
      await app.appLock.expectLock();
    });

    setTeamOwner(Team.WALLET_XP);
    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it("App stays locked with an incorrect password", async () => {
      await app.appLock.enterUnlockPassword("INCORRECT_PASSWORD");
      await app.appLock.unlock();
      await app.appLock.expectLock();
    });
  });
}
