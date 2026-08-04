import { writeFile } from "fs/promises";
import * as path from "path";
import { expect } from "@playwright/test";
import { test } from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import { Account, TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import { waitForIdentitiesInAppJson } from "tests/utils/userdata";
import { FileUtils } from "tests/utils/fileUtils";
import { DEVICE_TAGS } from "tests/utils/tagsUtils";
import { liveDataCommand } from "@ledgerhq/live-e2e-shared/cliCommandsUtils";

test.describe("Settings", () => {
  test.use({
    teamOwner: Team.WALLET_XP,
    userdata: "erc20-0-balance",
  });

  test(
    `[${TokenAccount.ETH_USDT_1.currency.testLabel}] - Hide empty token accounts hides a zero-balance ERC20 token`,
    {
      tag: [...DEVICE_TAGS, "@ethereum", "@family-evm"],
      annotation: [{ type: "TMS", description: "B2CQA-817" }],
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.mainNavigation.openTargetFromMainNavigation("accounts");
      await app.accounts.showParentAccountTokens(Account.ETH_1.accountName);
      await app.accounts.verifyTokenVisibility(TokenAccount.ETH_USDT_1.currency);
      await app.accounts.expectTokenBalanceToBeNull(TokenAccount.ETH_USDT_1.currency);
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

test.describe("Settings", () => {
  const account = Account.ETH_1;
  test.use({
    teamOwner: Team.WALLET_XP,
    userdata: "skip-onboarding-with-last-seen-device",
    cliCommands: [liveDataCommand(account)],
    speculosApp: account.currency.speculosApp,
    speculosForSetupOnly: true,
  });

  test(
    `[${account.currency.testLabel}] - Unlock the app with the correct password`,
    {
      tag: [...DEVICE_TAGS, "@ethereum", "@family-evm"],
      annotation: {
        type: "TMS",
        description: "B2CQA-2343, B2CQA-1763, B2CQA-826",
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.mainNavigation.openTargetFromMainNavigation("accounts");
      await app.accounts.expectCryptoAccountRowVisible(account.accountName);
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
      await app.accounts.expectCryptoAccountRowVisible(account.accountName);
      const countAfterLock = await app.accounts.countAccounts();
      await app.accounts.compareAccountsCountFromJson(countBeforeLock, countAfterLock);
      await app.accounts.navigateToAccountByName(account.accountName);
    },
  );
});

test.describe("Settings", () => {
  const account = Account.BTC_NATIVE_SEGWIT_1;
  test.use({
    teamOwner: Team.WALLET_XP,
    userdata: "skip-onboarding-with-last-seen-device",
    cliCommands: [liveDataCommand(account)],
    speculosApp: account.currency.speculosApp,
    speculosForSetupOnly: true,
  });

  test(
    `[${account.currency.testLabel}] - Select a counter value to display amounts`,
    {
      tag: [...DEVICE_TAGS, "@bitcoin", "@family-bitcoin"],
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

      await app.portfolio.expectBalanceDiffCounterValue("%");

      await app.portfolio.expectAssetValueToBe(account.currency, "€");
      await app.portfolio.expectOperationCounterValue("€");
    },
  );
});

test.describe("Settings", () => {
  test.use({
    teamOwner: Team.WALLET_XP,
    userdata: "skip-onboarding-with-last-seen-device",
  });

  test(
    "Access Ledger Support web link",
    {
      tag: [...DEVICE_TAGS],
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

test.describe("Settings", () => {
  test.use({
    teamOwner: Team.WALLET_XP,
    userdata: "1AccountBTC1AccountETH",
  });

  test(
    "Reset the app",
    {
      tag: [...DEVICE_TAGS, "@ethereum", "@family-evm"],
      annotation: {
        type: "TMS",
        description: "B2CQA-821",
      },
    },
    async ({ app, userdataFile, userdataDestinationPath }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.mainNavigation.openSettings();
      const { userId: userIdBefore } = await waitForIdentitiesInAppJson(userdataFile);

      const staleAppJsonBackup = path.join(userdataDestinationPath, "app.json.123");
      await writeFile(staleAppJsonBackup, "stale");

      await app.settings.goToHelpTab();
      await app.settings.resetApp();
      await app.settingsModal.checkResetModal();
      await app.settingsModal.clickOnConfirmButton();
      await app.settingsModal.expectIdentitiesRegenerated(userdataFile, userIdBefore);

      expect(
        await FileUtils.waitForFileToBeRemoved(staleAppJsonBackup, 15000),
        "stale app.json.* backup should be cleaned up on the Reset-app reboot",
      ).toBeTruthy();
    },
  );
});

test.describe("Settings", () => {
  test.use({
    teamOwner: Team.WALLET_XP,
    userdata: "1AccountBTC1AccountETH",
  });

  test(
    "Export logs",
    {
      tag: [...DEVICE_TAGS, "@ethereum", "@family-evm"],
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
      await app.settings.expectExportLogsFileCreated();
      await app.settings.moveExportedLogsToArtifacts();
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

test.describe("Settings", () => {
  test.use({
    teamOwner: Team.WALLET_XP,
    userdata: "skip-onboarding-with-last-seen-device",
  });

  for (const l10n of languageTestData) {
    test(
      `Change app language to ${l10n.lang}`,
      {
        tag: [...DEVICE_TAGS],
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
