import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { RecoverRestorePage } from "../../models/RecoverRestorePage";

test.use({
  userdata: "skip-onboarding",
});

test.describe.parallel("Recover", () => {
  test("Restore page with no device", async ({ page }) => {
    const recoverPage = new RecoverRestorePage(page);
    recoverPage.useDeepLink();

    await test.step("Text is visible", async () => {
      await expect(recoverPage.connectText).toBeVisible();
    });
  });
});
