import { test } from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-common/e2e/enum/Team";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import { LWD_WALLET_40_FF_DISABLED, LWD_WALLET_40_FF_ENABLED } from "tests/utils/featureFlagUtils";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";
import { getModularSelector } from "tests/utils/modularSelectorUtils";

// Skipping this suite as legacy is not visible on prod anymore
test.describe.skip("Portfolio - legacy", () => {
  test.use({
    teamOwner: Team.WALLET_XP,
    userdata: "speculos-subAccount",
    featureFlags: LWD_WALLET_40_FF_DISABLED,
  });
  test(
    "Charts are displayed when user added his accounts",
    {
      tag: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
      annotation: {
        type: "TMS",
        description: "B2CQA-927, B2CQA-928, B2CQA-3038",
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.mainNavigation.openTargetFromMainNavigation("home");
      await app.portfolio.checkBuySellButtonVisibility();
      await app.portfolio.checkStakeButtonVisibility();
      await app.portfolio.checkEmbeddedSwapContainerVisibility();
      await app.swap.expectSelectedAssetDisplayed(/ETH|BTC/);
      await app.portfolio.checkChartVisibility();
      await app.portfolio.checkAssetAllocationSection();
    },
  );
});

test.describe("Portfolio Wallet 4.0 - Zero balance state", () => {
  test.use({
    teamOwner: Team.WALLET_XP,
    userdata: "skip-onboarding-with-last-seen-device",
    featureFlags: LWD_WALLET_40_FF_ENABLED,
  });

  test(
    "Portfolio happy path: zero balance state, then verify balance and analytics",
    {
      tag: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
      annotation: {
        type: "TMS",
        description: "B2CQA-4343",
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.portfolio.checkNoBalanceTitleVisibility();
      await app.portfolio.expectPortfolioTotalBalanceNotVisible();
      await app.portfolio.expectOneDayPerformanceIndicatorNotVisible();

      await app.portfolio.checkReceiveButtonVisibility();
      await app.portfolio.checkBuyButtonVisibility();
      await app.portfolio.checkSellButtonDisabled();
      await app.portfolio.checkSendButtonDisabled();

      await app.portfolio.checkAddAccountButtonVisibility();
      await app.portfolio.clickAddAccountButton();
    },
  );
});

test.describe("Portfolio Wallet 4.0 - With Account", () => {
  test.use({
    teamOwner: Team.WALLET_XP,
    userdata: "1AccountSOL0Balance",
    featureFlags: LWD_WALLET_40_FF_ENABLED,
  });

  test(
    "Portfolio happy path: with zero-balance account, then verify balance and analytics",
    {
      tag: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
      annotation: {
        type: "TMS",
        description: "B2CQA-4350, B2CQA-4340, B2CQA-4342, B2CQA-4345",
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.portfolio.checkReceiveButtonVisibility();
      await app.portfolio.checkBuyButtonVisibility();
      await app.portfolio.checkSellButtonDisabled();
      await app.portfolio.checkSendButtonDisabled();

      await app.portfolio.expectTotalBalanceToBeZero();
      await app.portfolio.checkOneDayPerformanceIndicatorVisibility();
      await app.portfolio.clickOnPerformancePill();
      await app.analytics.expectAnalyticsScreenToBeVisible();
      await app.analytics.clickBackButton();
      await app.portfolio.expectPortfolioScreenToBeVisible();
    },
  );
});

test.describe("Portfolio Wallet 4.0 - With Funds", () => {
  test.use({
    teamOwner: Team.WALLET_XP,
    userdata: "1AccountBTC1AccountETH",
    featureFlags: LWD_WALLET_40_FF_ENABLED,
  });

  test(
    "Portfolio happy path: with funds, then verify balance and quick actions",
    {
      tag: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
      annotation: {
        type: "TMS",
        description: "B2CQA-4347, B2CQA-4339",
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.portfolio.checkSellButtonEnabled();
      await app.portfolio.checkSendButtonEnabled();
      await app.portfolio.expectBalanceVisibility();
      await app.portfolio.checkOneDayPerformanceIndicatorVisibility();
    },
  );
});

test.describe("Portfolio Wallet 4.0 - No seen device (Reborn mode)", () => {
  test.use({
    teamOwner: Team.WALLET_XP,
    userdata: "skip-onboarding",
    featureFlags: LWD_WALLET_40_FF_ENABLED,
  });

  test(
    "Portfolio no seen device: verify reborn quick actions are displayed",
    {
      tag: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
      annotation: {
        type: "TMS",
        description: "B2CQA-4348",
      },
    },
    async ({ app }) => {
      await app.portfolio.checkNoDeviceTitleVisibility();
      await app.portfolio.checkConnectButtonVisibility();
      await app.portfolio.checkBuyALedgerButtonVisibility();
    },
  );
});

test.describe("Portfolio Wallet 4.0 - add funded account", () => {
  const currency = Currency.BTC;
  test.use({
    teamOwner: Team.WALLET_XP,
    userdata: "1AccountSOL0Balance",
    featureFlags: LWD_WALLET_40_FF_ENABLED,
    speculosApp: currency.speculosApp,
  });

  test(
    "Portfolio: with zero-balance account, then add funded account and verify balance and quick actions",
    {
      tag: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
      annotation: {
        type: "TMS",
        description: "B2CQA-4351",
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.portfolio.checkReceiveButtonVisibility();
      await app.portfolio.checkBuyButtonVisibility();
      await app.portfolio.checkSellButtonDisabled();
      await app.portfolio.checkSendButtonDisabled();

      await app.mainNavigation.openTargetFromMainNavigation("accounts");
      await app.accounts.clickAddAccountButtonFromAccountsPage();
      const selector = await getModularSelector(app, "ASSET");
      if (selector) {
        await selector.validateItems();
        await selector.selectAssetByTicker(currency);
        await selector.selectNetwork(currency);
        await app.scanAccountsDrawer.selectFirstAccount();
        await app.scanAccountsDrawer.clickCloseButton();
      } else {
        await app.addAccount.expectModalVisibility();
        await app.addAccount.selectCurrency(currency);
        await app.addAccount.addAccounts();
        await app.addAccount.done();
      }

      await app.mainNavigation.openTargetFromMainNavigation("home");
      await app.portfolio.checkSellButtonEnabled();
      await app.portfolio.checkSendButtonEnabled();
      await app.portfolio.expectBalanceVisibility();
      await app.portfolio.checkOneDayPerformanceIndicatorVisibility();
    },
  );
});
