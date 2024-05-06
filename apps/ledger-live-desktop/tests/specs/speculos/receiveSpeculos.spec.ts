import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { Layout } from "../../models/Layout";
import { AccountPage } from "../../models/AccountPage";
import { AccountsPage } from "../../models/AccountsPage";
import { Modal } from "../../models/Modal";
import { ReceiveModal } from "../../models/ReceiveModal";
import { Account } from "../../enum/Account";
import {
  Device,
  specs,
  startSpeculos,
  stopSpeculos,
  pressRightUntil,
  pressBoth,
  //verifyAddress,
} from "../../utils/speculos";

test.use({ userdata: "speculos" });

let device: Device | undefined;

test.afterEach(async () => {
  await stopSpeculos(device);
});
//TODO Add Account.ADA_1
const accounts: Account[] = [
  Account.BTC_1,
  Account.ETH_1,
  Account.SOL_1,
  Account.TRX_1,
  Account.DOT_1,
  Account.XRP_1,
];

test.describe.parallel("Receive @smoke", () => {
  for (const account of accounts) {
    test(`[${account.currency.uiName}] Receive`, async ({ page }) => {
      const layout = new Layout(page);
      const accountsPage = new AccountsPage(page);
      const accountPage = new AccountPage(page);
      const modal = new Modal(page);
      const receiveModal = new ReceiveModal(page);
      device = await startSpeculos(
        test.name,
        specs[account.currency.deviceLabel.replace(/ /g, "_")],
      );

      await test.step(`Navigate to first account`, async () => {
        await layout.goToAccounts();
        await accountsPage.navigateToAccountByName(account.accountName);
        await accountPage.settingsButton.waitFor({ state: "visible" });
      });

      await test.step(`goToReceive and verify on LL`, async () => {
        await accountPage.receiveButton.click();
        await modal.continueButton.click();
        await expect(receiveModal.verifyAddressOnDevice).toBeVisible();
        await expect(receiveModal.receiveAddress(account.address)).toBeVisible();

        const displayedAddress = await receiveModal.addressDisplayed.innerText();
        expect(displayedAddress).toEqual(account.address);
      });

      await test.step(`[${account.currency.uiName}] Verify and Validate on device`, async () => {
        //FIX ME: Issue Verifying the address on the device : first device screen skipped
        //const addressScreen = await pressRightUntil(account.currency.receivePattern[0]);
        //expect(verifyAddress(account.address, addressScreen)).toBe(true);
        await pressRightUntil(account.currency.receivePattern[1]);
        await pressBoth();
        await expect(receiveModal.approve).toBeVisible();
      });
    });
  }
});
