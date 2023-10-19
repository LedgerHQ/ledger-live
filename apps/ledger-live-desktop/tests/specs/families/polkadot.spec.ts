import { expect } from "@playwright/test";
import test from "../../fixtures/common";
import { Layout } from "../../models/Layout";

test.use({ userdata: "1AccountDOT" });

test("Nomination flow", async ({ page }) => {
  const layout = new Layout(page);

  await test.step("Check if nominations icon is still here", async () => {
    await layout.goToAccounts();

    await page.locator('[data-test-id="account-component-Polkadot 1"]').click();
    await page.getByRole("button", { name: "Nominate" }).scrollIntoViewIfNeeded();
    await page.getByRole("button", { name: "Nominate" }).click();
    expect(await page.getByText("Validators (8)").isVisible()).toBeTruthy();
    await expect
      .soft(page.locator('[data-test-id="modal-content"]'))
      .toHaveScreenshot("nominate-modal-dot-nominator-row.png");
  });
});
