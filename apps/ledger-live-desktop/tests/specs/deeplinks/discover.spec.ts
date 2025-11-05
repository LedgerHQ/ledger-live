import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { sendDeepLink } from "../../utils/deeplink";

test.use({
  userdata: "skip-onboarding",
});

test.describe.parallel("Deeplinks - Discover", () => {
  for (const scheme of ["ledgerlive", "ledgerwallet"]) {
    test(`[${scheme}] Discover deeplink hot load @smoke`, async ({ page }) => {
      await test.step("on deeplink trigger", async () => {
        await sendDeepLink(page, `${scheme}://discover`);
        await expect.soft(page).toHaveScreenshot("loaded.png", {
          mask: [page.getByTestId("live-icon-container")],
        });
      });
    });
  }
});
