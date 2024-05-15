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
  specs,
  pressRightUntil,
  pressBoth,
  verifyAddress,
  verifyAmount,
  waitFor,
} from "../../utils/speculos";

test.use({ userdata: "speculos" });

// ONLY TESTNET (SEND WILL BE APPROVED ON DEVICE)
const transactions = [
  new Transaction(Account.tBTC_1, Account.tBTC_2, "0.00001", "medium"),
  new Transaction(Account.tETH_1, Account.tETH_2, "0.00001", "medium"),
];

for (const [i, transaction] of transactions.entries()) {
  test.describe.parallel("Send Approve @smoke", () => {
    test.use({
      userdata: "speculos",
      testName: `receiveSpeculos_${transaction.accountToDebit.currency.uiName}`,
      speculosCurrency: specs[transaction.accountToDebit.currency.deviceLabel.replace(/ /g, "_")],
      speculosOffset: i,
    });
    test(`[${transaction.accountToDebit.accountName}] send Approve`, async ({ page }) => {
      const layout = new Layout(page);
      const accountsPage = new AccountsPage(page);
      const accountPage = new AccountPage(page);
      const sendModal = new SendModal(page);
      const modal = new Modal(page);
      const receiveAddress = transaction.accountToCredit.address;

      await test.step(`Navigate to account`, async () => {
        await layout.goToAccounts();
        await accountsPage.navigateToAccountByName(transaction.accountToDebit.accountName);
      });

      await test.step(`send and check LL`, async () => {
        await accountPage.sendButton.click();
        await sendModal.fillRecipient(receiveAddress);
        await sendModal.continueButton.click();
        await modal.cryptoAmountField.fill(transaction.amount);
        await sendModal.countinueSendAmount();
        await expect(sendModal.verifyTotalDebit).toBeVisible();

        await expect(sendModal.checkAddress(receiveAddress)).toBeVisible();
        const displayedReceiveAddress = await sendModal.recipientAddressDisplayed.innerText();
        expect(displayedReceiveAddress).toEqual(transaction.accountToCredit.address);

        await expect(
          sendModal.checkAmount(transaction.accountToCredit.currency.uiLabel),
        ).toBeVisible();
        const displayedAmount = await sendModal.amountDisplayed.innerText();
        expect(displayedAmount).toEqual(expect.stringContaining(transaction.amount));

        await sendModal.continueButton.click();
      });

      await test.step(`[${transaction.accountToDebit.accountName}] Validate message on device`, async () => {
        await expect(sendModal.checkDevice).toBeVisible();
        const amountScreen = await pressRightUntil(DeviceLabels.AMOUT);
        expect(verifyAmount(transaction.amount, amountScreen)).toBe(true);
        const addressScreen = await pressRightUntil(DeviceLabels.ADDRESS);
        expect(verifyAddress(receiveAddress, addressScreen)).toBe(true);
        await pressRightUntil(transaction.accountToCredit.currency.sendPattern[2]);
        await pressBoth();
        switch (transaction.accountToDebit.currency.uiName) {
          case Currency.tBTC.uiName:
            await waitFor("Fees");
            await pressRightUntil(DeviceLabels.SIGN);
            await pressBoth();
            break;
          default:
            break;
        }
        await expect(sendModal.checkTransactionbroadcast).toBeVisible();
      });
    });
  });
}
