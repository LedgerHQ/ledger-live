import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { Layout } from "../../models/Layout";
import { AccountPage } from "../../models/AccountPage";
import { AccountsPage } from "../../models/AccountsPage";
import { ReceiveModal } from "../../models/ReceiveModal";
import { SpeculosModal } from "../../models/SpeculosModal";

test.use({ userdata: "speculos" });

const currencies = ["Ethereum", "Ethereum Holesky"];

for (const currency of currencies) {
  test(`[${currency}] Receive @smoke`, async ({ page }) => {
    const layout = new Layout(page);
    const accountsPage = new AccountsPage(page);
    const accountPage = new AccountPage(page);
    const receiveModal = new ReceiveModal(page);
    const speculosModal = new SpeculosModal(page);

    await test.step(`Navigate to first account`, async () => {
      await layout.goToAccounts();
      await accountsPage.navigateToAccountByName(`${currency} 1`);
      await accountPage.settingsButton.waitFor({ state: "visible" });
    });

    await test.step(`goToReceive`, async () => {
      await page.locator('[data-test-id="receive-button"]').click();
      await page.getByRole("button", { name: "Continue" }).click();
      await expect(
        page.getByText("Verify that the shared address exactly matches the one on your device"),
      ).toBeVisible();
    });

    await test.step(`[${currency}] Validate message`, async () => {
      await speculosModal.pressRight();
      if (currency === "Ethereum" || currency === "Ethereum Holesky") {
        await speculosModal.pressRight();
        await speculosModal.pressBoth();
      } else {
        await speculosModal.pressBoth();
      }
      await expect.soft(receiveModal.container).toHaveScreenshot(`Receive.png`);
      await page.getByRole("button", { name: "done" }).click();
    });
  });
}
//BUG with nanoApp version (GetAppAndVersionUnsupportedFormat: getAppAndVersion: format not supported)
