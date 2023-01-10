import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { TermsModal } from "tests/models/TermsModal";

test.use({ userdata: "skip-onboarding-with-terms" });

test("Terms of Use", async ({ page }) => {
  const termsModal = new TermsModal(page);

  await test.step("check for popup", async () => {
    await termsModal.isVisible();
    await expect(termsModal.termsModal).toBeVisible();
  });
});
