import test from "../../fixtures/common";
import { expect } from "@playwright/test";

test.use({
  userdata: "1AccountBTC1AccountETH",
  deeplink: "ledgerlive://discover/lido",
  // deeplink: "ledgerlive://receive?currency=btc",
});

test("Can open correct live app via a deeplink", async ({ page }) => {
  expect(await page.textContent("div")).toContain("Lido");
});
