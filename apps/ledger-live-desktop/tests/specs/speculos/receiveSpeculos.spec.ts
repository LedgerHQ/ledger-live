import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { Layout } from "../../models/Layout";
import { AccountPage } from "../../models/AccountPage";
import { AccountsPage } from "../../models/AccountsPage";
import { ReceiveModal } from "../../models/ReceiveModal";
import { Modal } from "../../models/Modal";
import { Currency } from "../../enum/Currency";
import { Device, specs, startSpeculos, stopSpeculos, pressRightUntil } from "../../utils/speculos";

test.use({ userdata: "speculos" });
let device: Device | null;

const currencies: Currency[] = [Currency.BTC];

for (const currency of currencies) {
  test(`[${currency.uiName}] Receive @smoke`, async ({ page }) => {
    const layout = new Layout(page);
    const accountsPage = new AccountsPage(page);
    const accountPage = new AccountPage(page);
    const receiveModal = new ReceiveModal(page);
    const modal = new Modal(page);
    device = await startSpeculos(test.name, specs[currency.uiName.replace(/ /g, "_")]);

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
      await pressRightUntil("Approve"); //TODO: Check if it "Approve" or something else
    });

    await test.step(`[${currency.uiName}] check screenshot`, async () => {
      await expect.soft(receiveModal.container).toHaveScreenshot(`Receive.png`);
    });
  });
  test.afterAll(async () => {
    await stopSpeculos(device);
  });
}
//BUG with nanoApp version (GetAppAndVersionUnsupportedFormat: getAppAndVersion: format not supported)
