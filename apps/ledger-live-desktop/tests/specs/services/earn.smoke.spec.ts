import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { Layout } from "../../models/Layout";

test.use({
  userdata: "1AccountBTC1AccountETH",
  featureFlags: {
    ptxEarn: {
      enabled: true,
    },
  },
});

test("Add accounts via Swap page", async ({ page }) => {
  const layout = new Layout(page);

  await test.step("Navigate to earn page", async () => {
    await layout.goToEarn();
    await expect.soft(page).toHaveScreenshot("earn-app-opened.png", {
      mask: [page.locator("data-test-id=earn-app-container")],
    });
  });
});
