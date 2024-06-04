import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { PortfolioPage } from "../../page/portfolio.page";

test.use({ userdata: "skip-onboarding-with-bad-account-data" });

test("Accounts resiliency works, the portfolio loads and evict 2 bad accounts from data", async ({
  page,
}) => {
  const portfolioPage = new PortfolioPage(page);

  await test.step("portfolio is in empty mode", async () => {
    await expect(portfolioPage.emptyStateTitle).toBeVisible();
  });
});
