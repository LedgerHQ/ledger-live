import { test } from "tests/fixtures/common";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";
import { CLI } from "tests/utils/cliUtils";

test.describe("Portfolio", () => {
  test.use({
    userdata: "speculos-tests-app",
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

      await app.layout.goToPortfolio();
      await app.portfolio.checkBuySellButtonVisibility();
      await app.portfolio.checkStakeButtonVisibility();
      await app.portfolio.checkSwapButtonVisibility();
      await app.portfolio.checkChartVisibility();
      await app.portfolio.checkAssetAllocationSection();
    },
  );
});

test.describe("Portfolio Wallet 4.0 - Zero balance state", () => {
  const currency = Currency.BTC;
  test.use({
    userdata: "skip-onboarding",
    speculosApp: currency.speculosApp,
    // to-do remove when wallet 4.0 is default
    featureFlags: {
      lwdWallet40: {
        enabled: true,
        params: {
          marketBanner: true,
          graphRework: true,
          quickActionCtas: true,
        },
      },
    },
  });

  test(
    "Portfolio happy path: zero balance state, then verify balance and analytics",
    {
      tag: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
      annotation: {
        type: "TMS",
        description:
          "B2CQA-4343, B2CQA-4350, B2CQA-4351, B2CQA-4347, B2CQA-4339, B2CQA-4340, B2CQA-4345",
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
  const currency = Currency.BTC;
  test.use({
    userdata: "skip-onboarding",
    speculosApp: currency.speculosApp,
    cliCommands: [
      (appjsonPath: string) => {
        return CLI.liveData({
          currency: currency.id,
          index: 0,
          add: true,
          appjson: appjsonPath,
        });
      },
    ],
    // to-do remove when wallet 4.0 is default
    featureFlags: {
      lwdWallet40: {
        enabled: true,
        params: {
          marketBanner: true,
          graphRework: true,
          quickActionCtas: true,
        },
      },
    },
  });

  test(
    "Portfolio happy path: zero balance state, add account, then verify balance and analytics",
    {
      tag: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
      annotation: {
        type: "TMS",
        description:
          "B2CQA-4343, B2CQA-4350, B2CQA-4351, B2CQA-4347, B2CQA-4339, B2CQA-4340, B2CQA-4345",
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.portfolio.checkSellButtonEnabled();
      await app.portfolio.checkSendButtonEnabled();

      await app.portfolio.checkPortfolioTotalBalanceVisibility();
      await app.portfolio.checkOneDayPerformanceIndicatorVisibility();
      await app.portfolio.clickOnPerformancePill();
      await app.analytics.expectAnalyticsScreenToBeVisible();
      await app.analytics.clickBackButton();
      await app.portfolio.expectPortfolioScreenToBeVisible();
    },
  );
});
