import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { LayoutComponent } from "../../component/layout.component";
import { PortfolioPage } from "../../page/portfolio.page";

test.use({ userdata: "1AccountBTC1AccountETHStarred" });

test("Portfolio @smoke", async ({ page }) => {
  const layout = new LayoutComponent(page);
  const portfolioPage = new PortfolioPage(page);

  await test.step("load portfolio", async () => {
    await layout.totalBalance.waitFor({ state: "visible" });
    await expect.soft(page).toHaveScreenshot("portfolio.png");
  });

  await test.step(`scroll to operations`, async () => {
    await portfolioPage.scrollToOperations();
    await expect.soft(page).toHaveScreenshot(`operations.png`);
  });
});
