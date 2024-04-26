import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { PortfolioPage } from "../../models/PortfolioPage";
import { Layout } from "../../models/Layout";
import { AccountPage } from "../../models/AccountPage";
import { Device, specs, startSpeculos, stopSpeculos } from "../../utils/speculos";

test.use({ userdata: "speculos" });
const token = "Tether USD";

let device: Device | undefined;

test.afterEach(async () => {
  await stopSpeculos(device);
});

test.describe.parallel("ERC20 token", () => {
  test(`Ckeck ERC20 token`, async ({ page }) => {
    const portfolioPage = new PortfolioPage(page);
    const layout = new Layout(page);
    const accountPage = new AccountPage(page);
    device = await startSpeculos(test.name, specs["Ethereum".replace(/ /g, "_")]);

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
