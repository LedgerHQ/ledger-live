import { test } from "../../fixtures/common";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "../../utils/customJsonReporter";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { CLI } from "tests/utils/cliUtils";

test.describe("Settings", () => {
  test.use({
    userdata: "erc20-0-balance",
  });

  test(
    `ERC20 token with 0 balance is hidden if 'hide empty token accounts' is ON`,
    {
      annotation: [{ type: "TMS", description: "B2CQA-817" }],
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations).split(", "));

      await app.layout.goToAccounts();
      await app.accounts.showParentAccountTokens(Account.ETH_1.accountName);
      await app.accounts.verifyTokenVisibility(
        Account.ETH_1.accountName,
        Account.ETH_USDT_1.currency,
      );
      await app.accounts.expectTokenBalanceToBeNull(
        Account.ETH_1.accountName,
        Account.ETH_USDT_1.currency,
      );
      await app.layout.goToSettings();
      await app.settings.goToAccountsTab();
      await app.settings.clickHideEmptyTokenAccountsToggle();
      await app.layout.goToAccounts();
      await app.accounts.verifyChildrenTokensAreNotVisible(Account.ETH_1.accountName);
    },
  );
});

test.describe("Password", () => {
  const account = Account.ETH_1;
  test.use({
    userdata: "skip-onboarding",
    cliCommands: [
      (appjsonPath: string) => {
        return CLI.liveData({
          currency: account.currency.currencyId,
          index: account.index,
          add: true,
          appjson: appjsonPath,
        });
      },
    ],
    speculosApp: account.currency.speculosApp,
  });

  test(
    "The user enter his password to access to the app",
    {
      annotation: {
        type: "TMS",
        description: "B2CQA-2343, B2CQA-1763, B2CQA-826",
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations).split(", "));

      await app.layout.goToAccounts();
      const countBeforeLock = await app.accounts.countAccounts();
      await app.layout.goToSettings();
      await app.password.toggle();
      await app.password.enablePassword("SpeculosPassword", "SpeculosPassword");
      await app.settings.goToHelpTab();
      await app.settings.clearCache();
      await app.LockscreenPage.login("bad password");
      await app.layout.checkInputErrorVisibibility("visible");
      await app.LockscreenPage.login("SpeculosPassword");
      await app.layout.goToAccounts();
      const countAfterLock = await app.accounts.countAccounts();
      await app.accounts.compareAccountsCountFromJson(countBeforeLock, countAfterLock);
      await app.accounts.navigateToAccountByName(account.accountName);
    },
  );
});

test.describe("counter value selection", () => {
  const account = Account.BTC_NATIVE_SEGWIT_1;
  test.use({
    userdata: "skip-onboarding",
    cliCommands: [
      (appjsonPath: string) => {
        return CLI.liveData({
          currency: account.currency.currencyId,
          index: account.index,
          add: true,
          appjson: appjsonPath,
        });
      },
    ],
    speculosApp: account.currency.speculosApp,
  });

  test(
    "User can select a counter value to display amount",
    {
      annotation: {
        type: "TMS",
        description: "B2CQA-804",
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations).split(", "));

      await app.layout.goToSettings();
      await app.settings.changeCounterValue("euro");
      await app.settings.expectCounterValue("Euro - EUR");
      await app.layout.goToPortfolio();

      await app.layout.waitForAccountsSyncToBeDone();
      await app.portfolio.expectTotalBalanceCounterValue("€");
      await app.portfolio.expectBalanceDiffCounterValue("€");
      await app.portfolio.expectAssetRowCounterValue(account.currency.name, "€");
      await app.portfolio.expectOperationCounterValue("€");
    },
  );
});
