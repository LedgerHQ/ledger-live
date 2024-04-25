import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { Layout } from "../../models/Layout";
import { AccountPage } from "../../models/AccountPage";
import { AccountsPage } from "../../models/AccountsPage";
import { Modal } from "../../models/Modal";
import { ReceiveModal } from "../../models/ReceiveModal";
import { Currency } from "../../enum/Currency";
import {
  Device,
  specs,
  startSpeculos,
  stopSpeculos,
  pressRightUntil,
  pressBoth,
  verifyAddress,
} from "../../utils/speculos";

test.use({ userdata: "speculos" });

let device: Device | undefined;

test.afterEach(async () => {
  await stopSpeculos(device);
});

const currencies: Currency[] = [Currency.ETH];

for (const currency of currencies) {
  test(`[${currency.uiName}] Receive @smoke`, async ({ page }) => {
    const layout = new Layout(page);
    const accountsPage = new AccountsPage(page);
    const accountPage = new AccountPage(page);
    const modal = new Modal(page);
    const receiveModal = new ReceiveModal(page);
    device = await startSpeculos(test.name, specs[currency.uiName.replace(/ /g, "_")]);

    await test.step(`Navigate to first account`, async () => {
      await layout.goToAccounts();
      await accountsPage.navigateToAccountByName(`${currency.uiName} 1`);
      await accountPage.settingsButton.waitFor({ state: "visible" });
    });

    await test.step(`goToReceive`, async () => {
      await accountPage.receiveButton.click();
      await modal.continueButton.click();
      await expect(receiveModal.verifyAddress).toBeVisible();
      await expect(receiveModal.receiveAddress(currency.address1)).toBeVisible();
    });

    await test.step(`[${currency.uiName}] Validate message`, async () => {
      const addressScreen = await pressRightUntil("Address");
      expect(verifyAddress(currency.address1, addressScreen)).toBe(true);
      await pressRightUntil("Accept");
      await pressBoth();
      await expect(receiveModal.approve).toBeVisible();
    });
  });
}
