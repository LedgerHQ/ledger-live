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

// ONLY TESTNET (SEND WILL BE APPROVED ON DEVICE)
const transactions = [
  //TODO: Reactivate when fees will be stable
  //new Transaction(Account.tBTC_1, Account.tBTC_2, "0.00001", "medium"),
  //TODO: Reactivate after blobs limit in txpool is full (-32000) resolved - JIRA: BACK-7135
  //new Transaction(Account.tETH_1, Account.tETH_2, "0.00001", "medium"),
  new Transaction(Account.sep_ETH_1, Account.sep_ETH_2, "0.00001", "medium"),
];

for (const transaction of transactions) {
  test.describe.parallel("Send Approve @smoke", () => {
    test.use({
      userdata: "speculos",
      testName: `receiveSpeculos_${transaction.accountToDebit.currency.uiName}`,
      speculosCurrency: specs[transaction.accountToDebit.currency.deviceLabel.replace(/ /g, "_")],
      speculosOffset: Math.floor(Math.random() * 10000),
    });

    //@TmsLink("B2CQA-479")
    //@TmsLink("B2CQA-1904")

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
        await expect(sendModal.totalDebitValue).toBeVisible();

        await expect(sendModal.addressValue(receiveAddress)).toBeVisible();
        const displayedReceiveAddress = await sendModal.recipientAddressDisplayedValue.innerText();
        expect(displayedReceiveAddress).toEqual(transaction.accountToCredit.address);

        await expect(
          sendModal.amountValue(transaction.amount, transaction.accountToCredit.currency.uiLabel),
        ).toBeVisible();
        const displayedAmount = await sendModal.amountDisplayedValue.innerText();
        expect(displayedAmount).toEqual(expect.stringContaining(transaction.amount));

        await sendModal.continueButton.click();
      });

      await test.step(`[${transaction.accountToDebit.accountName}] Validate message on device`, async () => {
        await expect(sendModal.checkDeviceLabel).toBeVisible();
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
        await expect(sendModal.checkTransactionbroadcastLabel).toBeVisible();
      });
    });
  });
}
