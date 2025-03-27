import { step } from "../../misc/reporters/step";
import { Drawer } from "../../component/drawer.component";
import { expect } from "@playwright/test";
import { NFTTransaction, Transaction } from "@ledgerhq/live-common/e2e/models/Transaction";
import { TransactionStatus } from "@ledgerhq/live-common/e2e/enum/TransactionStatus";

export class SendDrawer extends Drawer {
  private readonly addressValue = (address: string) =>
    this.page.locator('[data-testid="drawer-content"]').locator(`text=${address}`);
  private readonly amountValue = this.page.getByTestId("amountReceived-drawer");
  private readonly transactionType = this.page.getByTestId("transaction-type");
  private readonly nftName = this.page.getByTestId("nft-name-operationDrawer");

  @step("Verify address is visible")
  async addressValueIsVisible(address: string) {
    await expect(this.addressValue(address)).toBeVisible();
  }

  @step("Verify that the information of the transaction is visible")
  async expectReceiverInfos(tx: Transaction) {
    await expect(this.addressValue(tx.accountToCredit.address)).toBeVisible();
    await expect(this.amountValue).toBeVisible();
    const displayedAmount = await this.amountValue.innerText();
    expect(displayedAmount).toEqual(expect.stringContaining(tx.amount));
    expect(displayedAmount).toEqual(expect.stringContaining(tx.accountToDebit.currency.ticker));
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
}
