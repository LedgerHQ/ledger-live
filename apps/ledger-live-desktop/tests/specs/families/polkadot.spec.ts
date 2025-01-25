import { expect } from "@playwright/test";
import test from "../../fixtures/common";
import { Layout } from "../../component/layout.component";

test.use({ userdata: "1AccountDOT" });

test("Nomination flow", async ({ page }) => {
  const layout = new Layout(page);

  await test.step("Check if nominations icon is still here", async () => {
    await layout.goToAccounts();

    await page.locator('[data-testid="account-component-Polkadot 1"]').click();
    await page.getByRole("button", { name: "Nominate" }).scrollIntoViewIfNeeded();
    await page.getByRole("button", { name: "Nominate" }).click();
    expect(await page.getByText("Validators (8)").isVisible()).toBeTruthy();
    await expect
      .soft(page.locator('[data-testid="modal-content"]'))
      .toHaveScreenshot("nominate-modal-dot-nominator-row.png");
  });
});
