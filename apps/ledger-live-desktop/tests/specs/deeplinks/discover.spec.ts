import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { sendDeepLink } from "../../utils/deeplink";
import { DiscoverPage } from "../../page/discover.page";

test.use({
  userdata: "skip-onboarding",
});

test.describe.parallel("Deeplinks - Discover", () => {
  for (const scheme of ["ledgerlive", "ledgerwallet"]) {
    test(`[${scheme}] Discover deeplink hot load @smoke`, async ({ page }) => {
      await test.step("on deeplink trigger", async () => {
        const discoverPage = new DiscoverPage(page);
        await sendDeepLink(page, `${scheme}://discover`);
        await discoverPage.waitForDiscoverVisible();
        await page.mouse.move(0, 0);
        await page.evaluate(() => {
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
        });
        await expect.soft(page).toHaveScreenshot("loaded.png", {
          mask: [page.getByTestId("live-icon-container")],
        });
      });
    });
  }
});
