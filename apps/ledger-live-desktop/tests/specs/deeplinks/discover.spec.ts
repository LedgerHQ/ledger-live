import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { sendDeepLink } from "../../utils/deeplink";

test.use({
  userdata: "skip-onboarding",
});

test("Discover deeplink hot load @smoke", async ({ page }) => {
  await test.step("on deeplink trigger", async () => {
    await sendDeepLink(page, "ledgerlive://discover");
    await expect.soft(page).toHaveScreenshot("loaded.png", {
      mask: [page.getByTestId("live-icon-container")],
    });
  });
});
