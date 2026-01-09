import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { Layout } from "../../component/layout.component";
import { PortfolioPage } from "../../page/portfolio.page";

test.use({
  userdata: "1AccountBTC1AccountETHStarred",
  featureFlags: {
    lwdWallet40: {
      enabled: false,
    },
  },
});

test("Portfolio @smoke", async ({ page }) => {
  const layout = new Layout(page);
  const portfolioPage = new PortfolioPage(page);

  await test.step("load portfolio", async () => {
    await portfolioPage.expectTotalBalanceToBeVisible();
    await portfolioPage.checkBuySellButtonVisibility();
    await portfolioPage.checkSwapButtonVisibility();
    await portfolioPage.checkStakeButtonVisibility();
    await expect.soft(page).toHaveScreenshot("portfolio.png", {
      mask: [layout.marketPerformanceWidget],
    });
  });

  await test.step(`scroll to operations`, async () => {
    await portfolioPage.scrollToOperations();
    await expect.soft(page).toHaveScreenshot(`operations.png`);
  });
});
