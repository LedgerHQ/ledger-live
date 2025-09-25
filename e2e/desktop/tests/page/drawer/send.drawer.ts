import { step } from "../../misc/reporters/step";
import { Drawer } from "../../component/drawer.component";
import { expect } from "@playwright/test";
import { NFTTransaction, Transaction } from "@ledgerhq/live-common/e2e/models/Transaction";
import { TransactionStatus } from "@ledgerhq/live-common/e2e/enum/TransactionStatus";
import { getAccountAddress } from "@ledgerhq/live-common/e2e/enum/Account";

export class SendDrawer extends Drawer {
  private sendDrawer = this.page.getByTestId("drawer-content");
  private addressValue = (address: string) => this.sendDrawer.filter({ hasText: address });
  private amountValue = this.page.getByTestId("amountReceived-drawer").first();
  private transactionType = this.page.getByTestId("transaction-type");
  private nftName = this.page.getByTestId("nft-name-operationDrawer");
  private transactionTitle = this.page.getByTestId("modal-title").first();
  private transactionMessageStatus = this.page.getByTestId("success-message-label");
  private transactionStatus = this.page.getByTestId("status-drawer");
  private drawerOperationtype = this.page.getByTestId("operation-type");

  @step("Verify address is visible")
  async addressValueIsVisible(address: string) {
    await expect(this.addressValue(address)).toBeVisible();
  }

  @step("Verify that the information of the transaction is visible")
  async expectReceiverInfos(tx: Transaction) {
    await this.amountValue.waitFor();
    await expect(this.addressValue(getAccountAddress(tx.accountToCredit))).toBeVisible();
    await expect(this.amountValue).toBeVisible();
    const displayedAmount = await this.amountValue.innerText();
    expect(displayedAmount).toEqual(expect.stringContaining(tx.amount));
    expect(displayedAmount).toEqual(expect.stringContaining(tx.accountToDebit.currency.ticker));
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

  @step("Verify transaction status")
  async expectTransactionStatus(transactionStatus: string) {
    const displayedTransactionStatus = await this.transactionStatus.innerText();
    expect(displayedTransactionStatus).toEqual(transactionStatus);
  }

  @step("Verify drawer operation type")
  async expectDrawerOperationType(operationType: string) {
    const displayedOperationType = await this.drawerOperationtype.innerText();
    expect(displayedOperationType).toEqual(operationType);
  }

  @step("Verify Send NFT information")
  async expectNftInfos(tx: NFTTransaction) {
    const transactionType = await this.transactionType.textContent();
    expect(transactionType).toMatch(TransactionStatus.SENDING);
    const NFTName = await this.nftName.textContent();
    expect(NFTName).toBe(tx.nft.nftName);
    const address = await this.addressValue(tx.accountToCredit.address).textContent();
    expect(address).toBe(tx.accountToCredit.address);
  }

  @step("Verify that the information of the token transaction is visible")
  async expectTokenReceiverInfos(tx: Transaction) {
    await expect(this.amountValue).toBeVisible();
    const displayedAmount = await this.amountValue.innerText();
    expect(displayedAmount).toEqual(expect.stringContaining(tx.amount));
    expect(displayedAmount).toEqual(expect.stringContaining(tx.accountToDebit.currency.ticker));
  }
}
