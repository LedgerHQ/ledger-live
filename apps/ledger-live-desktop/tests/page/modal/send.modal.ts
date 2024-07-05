import { expect } from "@playwright/test";
import { Modal } from "../../component/modal.component";
import { step } from "tests/misc/reporters/step";
import { Transaction } from "../../models/Transaction";

export class SendModal extends Modal {
  private drowdownAccount = this.page.locator('[data-test-id="modal-content"] svg').nth(1);
  readonly recipientInput = this.page.getByPlaceholder("Enter");
  private continueRecipientButton = this.page.getByRole("button", { name: "continue" });
  private totalDebitValue = this.page.locator("text=Total to debit");
  private checkDeviceLabel = this.page.locator(
    "text=Double-check the transaction details on your Ledger device before signing.",
  );
  private checkTransactionbroadcastLabel = this.page.locator("text=Transaction sent");
  private addressValue = (address: string) =>
    this.page.getByTestId("modal-content").locator(`text=${address}`);
  private amountValue = (amount: string, currency: string) =>
    this.page.locator(`text=${amount} ${currency}`).first();
  private recipientAddressDisplayedValue = this.page.getByTestId("recipient-address");
  private amountDisplayedValue = this.page.getByTestId("transaction-amount");

  async selectAccount(name: string) {
    await this.drowdownAccount.click();
    await this.page.getByText(name).click();
  }

  async clickOnCameraButton() {
    await this.page.getByTestId("open-camera-qrcode-scanner").first().click();
  }

  @step("Click `Continue` button")
  async clickContinue() {
    await this.continueRecipientButton.click();
    await expect(this.checkDeviceLabel).toBeVisible();
  }

  @step("Enter recipient as $0")
  async fillRecipient(recipient: string) {
    await this.recipientInput.clear();
    await this.recipientInput.fill(recipient);
  }

  @step("Fill tx information")
  async fillTxInfo(tx: Transaction) {
    await this.fillRecipient(tx.recipient);
    await this.continueRecipientButton.click();
    await this.cryptoAmountField.fill(tx.amount);
    await this.countinueSendAmount();
  }

  @step("Verify tx information before confirming")
  async expectTxInfoValidity(tx: Transaction) {
    await expect(this.totalDebitValue).toBeVisible();
    await expect(this.addressValue(tx.recipient)).toBeVisible();
    const displayedReceiveAddress = await this.recipientAddressDisplayedValue.innerText();
    expect(displayedReceiveAddress).toEqual(tx.recipient);

    await expect(this.amountValue(tx.amount, tx.accountToDebit.currency.uiLabel)).toBeVisible();
    const displayedAmount = await this.amountDisplayedValue.innerText();
    expect(displayedAmount).toEqual(expect.stringContaining(tx.amount));
  }

  @step("Verify tx sent text")
  async expectTxSent() {
    await expect(this.checkTransactionbroadcastLabel).toBeVisible();
  }
}
