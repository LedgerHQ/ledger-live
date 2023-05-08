import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { TermsModal } from "../../models/TermsModal";

test.use({ userdata: "skip-onboarding-with-terms" });

test("Terms of Use", async ({ page }) => {
  const termsModal = new TermsModal(page);

  await test.step("check for popup", async () => {
    await termsModal.waitToBeVisible();
    await expect.soft(page).toHaveScreenshot("terms-modal.png");
  });
});
