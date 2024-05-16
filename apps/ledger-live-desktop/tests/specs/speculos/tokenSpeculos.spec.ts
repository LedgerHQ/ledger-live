import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { PortfolioPage } from "../../models/PortfolioPage";
import { Layout } from "../../models/Layout";
import { AccountPage } from "../../models/AccountPage";
import { specs } from "../../utils/speculos";

test.use({
  userdata: "speculos",
  testName: "tokenERC20",
  speculosCurrency: specs["Ethereum".replace(/ /g, "_")],
  speculosOffset: Math.floor(Math.random() * 10000),
});
const token = "Tether USD";

test.describe.parallel("ERC20 token", () => {
  test(`Ckeck ERC20 token`, async ({ page }) => {
    const portfolioPage = new PortfolioPage(page);
    const layout = new Layout(page);
    const accountPage = new AccountPage(page);

    await test.step(`navigate to portfolio`, async () => {
      await layout.goToPortfolio();
      await portfolioPage.navigateToAsset(token);
    });

    await test.step(`account allocation`, async () => {
      await expect(accountPage.token(token)).toBeVisible();
      await accountPage.navigateToToken(token);
      await expect(accountPage.scrollToOperations).not.toBeNull();
    });
  });
});
