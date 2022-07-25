import test from "../../fixtures/common";
import { expect } from "@playwright/test";

test.use({ userdata: "skip-onboarding-with-terms" });

test("Terms of Use", async ({ page }) => {
  await test.step("check for popup", async () => {
    const modal = page.locator('[data-test-id="terms-update-popup"]');

    expect(await modal.isVisible()).toBe(true);
  });
});
