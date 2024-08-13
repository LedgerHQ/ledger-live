import { test } from "../../fixtures/common";

test.describe("Portfolio", () => {
  test.use({
    userdata: "speculos-tests-app",
  });
  test(
    "Charts are displayed when user added his accounts",
    {
      annotation: {
        type: "TMS",
        description: "B2CQA-927, B2CQA-928",
      },
    },
    async ({ app }) => {
      await app.layout.goToPortfolio();
      await app.portfolio.checkBuySellButtonVisibility();
      await app.portfolio.checkStakeButtonVisibility();
      await app.portfolio.checkSwapButtonVisibility();
      await app.portfolio.checkChartVisibility();
      await app.portfolio.checkMarketPerformanceTrendVisibility();
      await app.portfolio.checkAssetAllocationSection();
    },
  );
});
