import { step } from "../../misc/reporters/step";
import { Drawer } from "../../component/drawer.component";
import { expect } from "@playwright/test";
import { Transaction } from "@ledgerhq/live-common/e2e/models/Transaction";

export class SendDrawer extends Drawer {
  private sendDrawer = this.page.getByTestId("drawer-content");
  private addressValue = (address: string) => this.sendDrawer.filter({ hasText: address });
  private transactionTitle = this.page.getByTestId("modal-title").first();
  private transactionMessageStatus = this.page.getByTestId("success-message-label");
  private amountValue = this.page.getByTestId("amountReceived-drawer").first();
  private transactionStatus = this.page.getByTestId("status-drawer");
  private drawerOperationType = this.page.getByTestId("operation-type");
  private operationFromAccount = this.page.getByTestId("operation-from");
  private operationToAccount = this.page.getByTestId("operation-to");

  @step("Verify address is visible")
  async addressValueIsVisible(address: string | undefined) {
    if (!address) {
      throw new Error("Recipient address is not set");
    }
    await expect(this.addressValue(address)).toBeVisible();
  }

  @step("Verify transaction title")
  async expectTransactionTitle(transactionTitle: string) {
    const displayedTransactionTitle = await this.transactionTitle.innerText();
    expect(displayedTransactionTitle).toEqual(transactionTitle);
  }

  @step("Verify transaction message status")
  async expectTransactionMessageStatus(transactionMessage: string) {
    const displayedTransactionMessageStatus = await this.transactionMessageStatus.innerText();
    expect(displayedTransactionMessageStatus).toEqual(transactionMessage);
  }

  @step("Verify that the information of the transaction is visible")
  async expectReceiverInfos(tx: Transaction) {
    await this.amountValue.waitFor();
    if (!tx.accountToCredit.address) {
      throw new Error("Recipient address is not set");
    }
    await expect(this.addressValue(tx.accountToCredit.address)).toBeVisible();
    await expect(this.amountValue).toBeVisible();
    const displayedAmount = await this.amountValue.innerText();
    expect(displayedAmount).toEqual(expect.stringContaining(tx.amount));
    expect(displayedAmount).toEqual(expect.stringContaining(tx.accountToDebit.currency.ticker));
  }

  @step("Verify transaction status")
  async expectTransactionStatus(transactionStatus: string) {
    const displayedTransactionStatus = await this.transactionStatus.innerText();
    expect(displayedTransactionStatus).toEqual(transactionStatus);
  }

  @step("Verify drawer operation type")
  async expectDrawerOperationType(operationType: string) {
    const displayedOperationType = await this.drawerOperationType.innerText();
    expect(displayedOperationType).toEqual(operationType);
  }

  @step("Verify drawer accounts")
  async expectDrawerAccounts(tx: Transaction) {
    if (!tx.accountToCredit.address || !tx.accountToDebit.address) {
      throw new Error("Account addresses are not set");
    }
    await expect(this.operationToAccount).toContainText(tx.accountToCredit.address);
    await expect(this.operationFromAccount).toContainText(tx.accountToDebit.address);
  }

  @step("Verify that the information of the token transaction is visible")
  async expectTokenReceiverInfos(tx: Transaction) {
    await expect(this.amountValue).toBeVisible();
    const displayedAmount = await this.amountValue.innerText();
    expect(displayedAmount).toEqual(expect.stringContaining(tx.amount));
    expect(displayedAmount).toEqual(expect.stringContaining(tx.accountToDebit.currency.ticker));
  }
}
