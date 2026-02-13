import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { DiscoverPage } from "../../page/discover.page";

test.use({
  userdata: "skip-onboarding",
  env: {
    LEDGER_LIVE_DEEPLINK: "ledgerlive://discover",
  },
});

test("Discover deeplink cold start @smoke", async ({ page }) => {
  await test.step("on load", async () => {
    const discoverPage = new DiscoverPage(page);
    await discoverPage.waitForDiscoverVisible();
    await expect.soft(page).toHaveScreenshot("loaded.png", {
      mask: [page.getByTestId("live-icon-container")],
    });
  });
});
