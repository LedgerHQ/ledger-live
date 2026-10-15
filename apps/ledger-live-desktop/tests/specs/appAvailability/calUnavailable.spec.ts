import test from "../../fixtures/common";
import { expect } from "@playwright/test";

test.use({ userdata: "skip-onboarding", env: { CAL_HEALTHCHECK: "failed" } });

test("CAL unavailable", async ({ page }) => {
  await test.step("displays the unavailable screen", async () => {
    await expect(page.getByTestId("service-unavailable")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Ledger Wallet is currently unavailable" }),
    ).toBeVisible();
  });
});
