import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { Layout } from "../../models/Layout";
import { AccountsPage } from "../../models/AccountsPage";
import { AccountPage } from "../../models/AccountPage";
import { SendModal } from "../../models/SendModal";
import { Modal } from "../../models/Modal";
import { Account } from "../../enum/Account";
import {
  Device,
  specs,
  startSpeculos,
  stopSpeculos,
  pressRightUntil,
  pressBoth,
  verifyAddress,
  verifyAmount,
} from "../../utils/speculos";

test.use({ userdata: "speculos" });

let device: Device | undefined;

test.afterEach(async () => {
  await stopSpeculos(device);
});

// ONLY TESTNET (SEND WILL BE APPROVED ON DEVICE)
const accounts: Account[] = [Account.tETH_1];

test.describe.parallel("Send Approve @smoke", () => {
  for (const account of accounts) {
    test(`[${account.currency.uiName}] send Approve`, async ({ page }) => {
      const layout = new Layout(page);
      const accountsPage = new AccountsPage(page);
      const accountPage = new AccountPage(page);
      const sendModal = new SendModal(page);
      const modal = new Modal(page);
      device = await startSpeculos(
        test.name,
        specs[account.currency.deviceLabel.replace(/ /g, "_")],
      );

      await test.step(`Navigate to account`, async () => {
        await layout.goToAccounts();
        await accountsPage.navigateToAccountByName(account.accountName);
      });

      await test.step(`send`, async () => {
        await accountPage.sendButton.click();
        const address = account.addressForSendTest;
        await sendModal.fillRecipient(address);
        await sendModal.continueButton.click();
        await modal.cryptoAmountField.fill("0.00001");
        await sendModal.countinueSendAmount();
        await expect(sendModal.verifyTotalDebit).toBeVisible();
        await expect(sendModal.checkAddress(account.addressForSendTest)).toBeVisible();
        await expect(sendModal.checkAmount(account.currency.uiLabel)).toBeVisible();
        await sendModal.continueButton.click();
      });

      await test.step(`[${account.currency.uiName}] Validate message on device`, async () => {
        await expect(sendModal.checkDevice).toBeVisible();
        const amountScreen = await pressRightUntil("Amount");
        expect(verifyAmount("0.00001", amountScreen)).toBe(true);
        const addressScreen = await pressRightUntil("Address");
        expect(verifyAddress(account.addressForSendTest, addressScreen)).toBe(true);
        await pressRightUntil(account.currency.sendPattern[2]);
        await pressBoth();
        await expect(sendModal.checkTransactionbroadcast).toBeVisible();
      });
    });
  }
});
