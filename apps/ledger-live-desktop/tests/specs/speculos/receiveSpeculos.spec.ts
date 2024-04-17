import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { Layout } from "../../models/Layout";
import { AccountPage } from "../../models/AccountPage";
import { AccountsPage } from "../../models/AccountsPage";
import { ReceiveModal } from "../../models/ReceiveModal";
import { SpeculosModal } from "../../models/SpeculosModal";
import { Modal } from "../../models/Modal";
import { Currency } from "../../enum/Currency";

test.use({ userdata: "speculos" });

const currencies: Currency[] = [Currency.ETH];

for (const currency of currencies) {
  test(`[${currency.uiName}] Receive @smoke`, async ({ page }) => {
    const layout = new Layout(page);
    const accountsPage = new AccountsPage(page);
    const accountPage = new AccountPage(page);
    const receiveModal = new ReceiveModal(page);
    const speculosModal = new SpeculosModal(page);
    const modal = new Modal(page);

    await test.step(`Navigate to first account`, async () => {
      await layout.goToAccounts();
      await accountsPage.navigateToAccountByName(`${currency.uiName} 1`);
      await accountPage.settingsButton.waitFor({ state: "visible" });
    });

    await test.step(`goToReceive`, async () => {
      await accountPage.receiveButton.click();
      await modal.continueButton.click();
      await expect(modal.verifyAddress).toBeVisible();
    });

    await test.step(`[${currency.uiName}] Validate message`, async () => {
      await speculosModal.pressRight();
      if (currency === Currency.ETH || currency === Currency.tETH) {
        await speculosModal.pressRight();
        await speculosModal.pressBoth();
      } else {
        await speculosModal.pressBoth();
      }
      await expect.soft(receiveModal.container).toHaveScreenshot(`Receive.png`);
    });
  });
}
//BUG with nanoApp version (GetAppAndVersionUnsupportedFormat: getAppAndVersion: format not supported)
