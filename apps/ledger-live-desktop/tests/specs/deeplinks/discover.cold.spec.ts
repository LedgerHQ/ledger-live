import test from "../../fixtures/common";
import { expect } from "@playwright/test";

test.use({
  userdata: "skip-onboarding",
  env: {
    LEDGER_LIVE_DEEPLINK: "ledgerlive://discover",
  },
});

test("Discover deeplink cold start @smoke", async ({ page }) => {
  await test.step("on load", async () => {
    await expect.soft(page).toHaveScreenshot("loaded.png", {
      mask: [page.getByTestId("live-icon-container")],
    });
  });
});
