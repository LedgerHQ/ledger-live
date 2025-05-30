import { test } from "../fixtures/common";
import { addTmsLink } from "../utils/allureUtils";
import { getDescription } from "../utils/customJsonReporter";

test.describe("Portfolio", () => {
  test.use({
    userdata: "speculos-tests-app",
  });
  test(
    "Charts are displayed when user added his accounts",
    {
      tag: ["@NanoSP", "@LNS", "@NanoX"],
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
      await app.portfolio.checkMarketPerformanceTrendVisibility();
      await app.portfolio.checkAssetAllocationSection();
    },
  );
});
