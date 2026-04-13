import { test } from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-common/e2e/enum/Team";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import { Account, TokenAccount } from "@ledgerhq/live-common/e2e/enum/Account";
import { FileUtils } from "tests/utils/fileUtils";
import { liveDataCommand } from "@ledgerhq/live-common/e2e/cliCommandsUtils";
import { isWallet40Enabled } from "tests/utils/featureFlagUtils";

test.describe("Settings", () => {
  test.use({
    teamOwner: Team.WALLET_XP,
    userdata: "erc20-0-balance",
  });

  test(
    `ERC20 token with 0 balance is hidden if 'hide empty token accounts' is ON`,
    {
      tag: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
      annotation: [{ type: "TMS", description: "B2CQA-817" }],
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.mainNavigation.openTargetFromMainNavigation("accounts");
      await app.accounts.showParentAccountTokens(Account.ETH_1.accountName);
      await app.accounts.verifyTokenVisibility(
        Account.ETH_1.accountName,
        TokenAccount.ETH_USDT_1.currency,
      );
      await app.accounts.expectTokenBalanceToBeNull(
        Account.ETH_1.accountName,
        TokenAccount.ETH_USDT_1.currency,
      );
      await app.mainNavigation.openSettings();
      await app.settings.goToAccountsTab();
      await app.settings.clickHideEmptyTokenAccountsToggle();
      await app.mainNavigation.openTargetFromMainNavigation("accounts");
      await app.accounts.verifyChildrenTokensAreNotVisible(
        Account.ETH_1.accountName,
        TokenAccount.ETH_USDT_1.currency,
      );
    },
  );
});

test.describe("Password", () => {
  const account = Account.ETH_1;
  test.use({
    teamOwner: Team.WALLET_XP,
    userdata: "skip-onboarding-with-last-seen-device",
    cliCommands: [liveDataCommand(account)],
    speculosApp: account.currency.speculosApp,
  });

  test(
    "The user enter his password to access to the app",
    {
      tag: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", `@ethereum`, "@family-evm"],
      annotation: {
        type: "TMS",
        description: "B2CQA-2343, B2CQA-1763, B2CQA-826",
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.mainNavigation.openTargetFromMainNavigation("accounts");
      const countBeforeLock = await app.accounts.countAccounts();
      await app.mainNavigation.openSettings();
      await app.password.toggle();
      await app.password.enablePassword("SpeculosPassword", "SpeculosPassword");
      await app.settings.goToHelpTab();
      await app.settings.clearCache();
      await app.LockscreenPage.login("bad password");
      await app.LockscreenPage.checkInputErrorVisibility("visible");
      await app.LockscreenPage.login("SpeculosPassword");
      await app.mainNavigation.openTargetFromMainNavigation("accounts");
      const countAfterLock = await app.accounts.countAccounts();
      await app.accounts.compareAccountsCountFromJson(countBeforeLock, countAfterLock);
      await app.accounts.navigateToAccountByName(account.accountName);
    },
  );
});

test.describe("counter value selection", () => {
  const account = Account.BTC_NATIVE_SEGWIT_1;
  test.use({
    teamOwner: Team.WALLET_XP,
    userdata: "skip-onboarding-with-last-seen-device",
    cliCommands: [liveDataCommand(account)],
    speculosApp: account.currency.speculosApp,
  });

  test(
    "User can select a counter value to display amount",
    {
      tag: [
        "@NanoSP",
        "@LNS",
        "@NanoX",
        "@Stax",
        "@Flex",
        "@NanoGen5",
        "@bitcoin",
        "@family-bitcoin",
      ],
      annotation: {
        type: "TMS",
        description: "B2CQA-804",
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.mainNavigation.openSettings();
      await app.settings.changeCounterValue("euro");
      await app.settings.expectCounterValue("Euro - EUR");
      await app.mainNavigation.openTargetFromMainNavigation("home");

      await app.layout.waitForAccountsSyncToBeDone();
      await app.portfolio.expectTotalBalanceCounterValue("€");

      // Wallet 4.0 only shows percentage change
      const expectedCounterValue = (await isWallet40Enabled(app.getPage())) ? "%" : "€";
      await app.portfolio.expectBalanceDiffCounterValue(expectedCounterValue);

      await app.portfolio.expectAssetRowCounterValue(account.currency.name, "€");
      await app.portfolio.expectOperationCounterValue("€");
    },
  );
});

test.describe("Ledger Support (web link)", () => {
  test.use({
    teamOwner: Team.WALLET_XP,
    userdata: "skip-onboarding-with-last-seen-device",
  });

  test(
    "Verify that user can access to Ledger Support (Web Link)",
    {
      tag: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
      annotation: {
        type: "TMS",
        description: "B2CQA-820",
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.mainNavigation.openSettings();
      await app.settings.goToHelpTab();

      await app.settings.expectLedgerSupportUrlToBeCorrect();
    },
  );
});

test.describe("Reset app", () => {
  test.use({
    teamOwner: Team.WALLET_XP,
    userdata: "1AccountBTC1AccountETH",
  });

  test(
    "Verify that user can Reset app",
    {
      tag: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
      annotation: {
        type: "TMS",
        description: "B2CQA-821",
      },
    },
    async ({ app, userdataFile }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.mainNavigation.openSettings();
      const appJsonBefore = await FileUtils.getAppJsonSize(userdataFile);
      await app.settings.goToHelpTab();
      await app.settings.resetApp();
      await app.settingsModal.checkResetModal();
      await app.settingsModal.clickOnConfirmButton();
      await app.onboarding.waitForLaunch();
      const appJsonAfter = await FileUtils.getAppJsonSize(userdataFile);
      await FileUtils.compareAppJsonSize(appJsonBefore, appJsonAfter);
    },
  );
});

test.describe("Settings - Help tab", () => {
  test.use({
    teamOwner: Team.WALLET_XP,
    userdata: "1AccountBTC1AccountETH",
  });

  test(
    "Verify that user can view user data folder and export logs",
    {
      tag: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
      annotation: {
        type: "TMS",
        description: "B2CQA-825, B2CQA-2074",
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.mainNavigation.openSettings();
      await app.settings.goToHelpTab();
      await app.settings.checkViewUserDataButtonIsEnabled();
      await app.settings.clickExportLogs();
    },
  );
});

const languageTestData = [
  {
    lang: "Français",
    generalTabLabel: "Général",
    characterSet: /[\u00C0-\u024F]/,
    languageLabel: "Langue d\u2019affichage",
    counterValueLabel: "Monnaie pr\u00e9f\u00e9r\u00e9e",
    themeLabel: "Mode",
  },
  {
    lang: "Русский",
    generalTabLabel: "Общие",
    characterSet: /[\u0400-\u04FF]/,
    languageLabel: "Язык",
    counterValueLabel: "Предпочтительная валюта",
    themeLabel: "Тема оформления",
  },
  {
    lang: "日本語",
    generalTabLabel: "一般",
    characterSet: /[\u4E00-\u9FFF]/,
    languageLabel: "表示言語",
    counterValueLabel: "優先する通貨",
    themeLabel: "テーマ",
  },
];

test.describe("Language change", () => {
  test.use({
    teamOwner: Team.WALLET_XP,
    userdata: "skip-onboarding-with-last-seen-device",
  });

  for (const l10n of languageTestData) {
    test(
      `Settings — change app language to ${l10n.lang}`,
      {
        tag: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
        annotation: { type: "TMS", description: "B2CQA-2344" },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

        await app.mainNavigation.openSettings();
        await app.settings.changeLanguage(l10n.lang);
        await app.settings.expectLanguageSelected(l10n.lang);
        await app.settings.expectGeneralTabLabel(l10n.generalTabLabel);
        await app.settings.expectCounterValueRowCharacterSet(l10n.characterSet);
        await app.settings.expectLanguageRowTranslation(l10n.languageLabel);
        await app.settings.expectCounterValueRowTranslation(l10n.counterValueLabel);
        await app.settings.expectThemeRowTranslation(l10n.themeLabel);
      },
    );
  }
});
