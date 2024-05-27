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
  speculosOffset: 0,
});
const token = "Tether USD";

test.describe.parallel("ERC20 token", () => {
  //@TmsLink("B2CQA-1079")

  test(`Ckeck ERC20 token`, async ({ page }) => {
    const portfolioPage = new PortfolioPage(page);
    const layout = new Layout(page);
    const accountPage = new AccountPage(page);

    await test.step(`navigate to portfolio`, async () => {
      await layout.goToPortfolio();
      await portfolioPage.navigateToAsset(token);
    });

    await test.step(`account allocation`, async () => {
      await expect(accountPage.tokenValue(token)).toBeVisible();
      await accountPage.navigateToToken(token);
      expect(accountPage.scrollToOperations).not.toBeNull();
    });
  });
});
