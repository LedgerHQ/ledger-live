import { test } from "tests/fixtures/common";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";

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

test.describe("Portfolio Wallet 4.0", () => {
  test.use({
    userdata: "speculos-tests-app",
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
    "Portfolio displays balance and performance indicators with non-zero balance accounts and clicking on performance pill navigates to analytics",
    {
      tag: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
      annotation: {
        type: "TMS",
        description: "B2CQA-4339, B2CQA-4340, B2CQA-4345",
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await app.portfolio.checkPortfolioTotalBalanceVisibility();
      await app.portfolio.checkOneDayPerformanceIndicatorVisibility();
      await app.portfolio.clickOnPerformancePill();
      await app.analytics.expectAnalyticsScreenToBeVisible();
      await app.analytics.clickBackButton();
      await app.portfolio.expectPortfolioScreenToBeVisible();
    },
  );
});
