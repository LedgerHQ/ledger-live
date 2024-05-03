import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { Layout } from "../../models/Layout";
import { AccountsPage } from "../../models/AccountsPage";
import { AccountPage } from "../../models/AccountPage";
import { SendModal } from "../../models/SendModal";
import { Modal } from "../../models/Modal";
import { Account } from "../../enum/Account";
import { Currency } from "../../enum/Currency";
import { DeviceLabels } from "tests/enum/DeviceLabels";
import { Transaction } from "../../models/Transaction";
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
const transactions = [
  new Transaction(Account.tBTC_1, Account.tBTC_2, "0.00001", "medium"),
  new Transaction(Account.tETH_1, Account.tETH_2, "0.00001", "medium"),
];

test.describe.parallel("Send Approve @smoke", () => {
  for (const transaction of transactions) {
    test(`[${transaction.accountToDebit.accountName}] send Approve`, async ({ page }) => {
      const layout = new Layout(page);
      const accountsPage = new AccountsPage(page);
      const accountPage = new AccountPage(page);
      const sendModal = new SendModal(page);
      const modal = new Modal(page);
      device = await startSpeculos(
        test.name,
        specs[transaction.accountToDebit.currency.deviceLabel.replace(/ /g, "_")],
      );
      const receiveAddress = transaction.accountToCredit.address;

      await test.step(`Navigate to account`, async () => {
        await layout.goToAccounts();
        await accountsPage.navigateToAccountByName(transaction.accountToDebit.accountName);
      });

      await test.step(`send`, async () => {
        await accountPage.sendButton.click();
        await sendModal.fillRecipient(receiveAddress);
        await sendModal.continueButton.click();
        await modal.cryptoAmountField.fill(transaction.amount);
        await sendModal.countinueSendAmount();
        await expect(sendModal.verifyTotalDebit).toBeVisible();
        await expect(sendModal.checkAddress(receiveAddress)).toBeVisible();
        await expect(
          sendModal.checkAmount(transaction.accountToCredit.currency.uiLabel),
        ).toBeVisible(); //changer pour lui passer la currency
        await sendModal.continueButton.click();
      });

      await test.step(`[${transaction.accountToDebit.accountName}] Validate message on device`, async () => {
        await expect(sendModal.checkDevice).toBeVisible();
        const amountScreen = await pressRightUntil(DeviceLabels.Amount);
        expect(verifyAmount(transaction.amount, amountScreen)).toBe(true);
        const addressScreen = await pressRightUntil(DeviceLabels.Address);
        expect(verifyAddress(receiveAddress, addressScreen)).toBe(true);
        // TODO: REMOVE SEND PATTERN / issue: can be Continue or accept
        await pressRightUntil(transaction.accountToCredit.currency.sendPattern[2]);
        await pressBoth();
        switch (transaction.accountToDebit.currency.uiName) {
          case Currency.tBTC.uiName:
            await pressRightUntil(DeviceLabels.Continue);
            await pressBoth();
            await pressRightUntil(DeviceLabels.Continue);
            await pressBoth();
            await pressRightUntil(DeviceLabels.Sign);
            await pressBoth();
            break;
          default:
            break;
        }
        await expect(sendModal.checkTransactionbroadcast).toBeVisible();
      });
    });
  }
});
