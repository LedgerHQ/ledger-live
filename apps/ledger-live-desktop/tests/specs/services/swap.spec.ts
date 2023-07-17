import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { SwapPage } from "../../models/SwapPage";

test.use({
  userdata: "1AccountBTC1AccountETH",
});

test.describe.parallel("Swap - Miscellaneous tests", () => {
  test("Swap not yet available due to API error", async ({ page }) => {
    const swapPage = new SwapPage(page);

    await page.route("https://swap.ledger.com/v4/providers**", async route => {
      route.fulfill({ headers: { teststatus: "mocked" }, status: 404 });
    });

    await swapPage.navigate();
    await expect(page.getByText("swap is not available yet in your area")).toBeVisible();
  });

  test("Swap not yet available due to no valid providers", async ({ page }) => {
    const swapPage = new SwapPage(page);

    const providers = JSON.stringify({
      currencies: {},
      providers: {},
    });

    await page.route("https://swap.ledger.com/v4/providers**", async route => {
      route.fulfill({ headers: { teststatus: "mocked" }, body: providers });
    });

    await swapPage.navigate();
    await expect(page.getByText("swap is not available yet in your area")).toBeVisible();
  });
});
