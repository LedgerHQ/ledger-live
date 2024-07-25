import { expect } from "@playwright/test";
import { Modal } from "../../component/modal.component";
import { step } from "tests/misc/reporters/step";
import { Transaction } from "../../models/Transaction";

export class SendModal extends Modal {
  private drowdownAccount = this.page.locator('[data-test-id="modal-content"] svg').nth(1);
  readonly recipientInput = this.page.locator('[id="send-recipient-input"]');
  readonly continueButton = this.page.getByRole("button", { name: "continue" });
  private totalDebitValue = this.page.locator("text=Total to debit");
  private checkDeviceLabel = this.page.locator(
    "text=Double-check the transaction details on your Ledger device before signing.",
  );
  private checkTransactionbroadcastLabel = this.page.locator("text=Transaction sent");
  private recipientAddressDisplayedValue = this.page.locator("data-test-id=recipient-address");
  private amountDisplayedValue = this.page.locator("data-test-id=transaction-amount");
  private ASAErrorMessage = this.page.getByText(
    "Recipient account has not opted in the selected ASA.",
  );
  private invalidAddressErrorMessage = (network: string) =>
    this.page.getByText(`This is not a valid ${network} address`);

  async selectAccount(name: string) {
    await this.drowdownAccount.click();
    await this.page.getByText(name).click();
  }

  async clickOnCameraButton() {
    await this.page.getByTestId("open-camera-qrcode-scanner").first().click();
  }

  @step("Click `Continue` button")
  async clickContinueToDevice() {
    await this.continueButton.click();
    await expect(this.checkDeviceLabel).toBeVisible();
  }

  @step("Enter recipient as $0")
  async fillRecipient(recipient: string) {
    await this.recipientInput.clear();
    await this.recipientInput.fill(recipient);
  }

  @step("Fill tx information")
  async fillTxInfo(tx: Transaction) {
    await this.fillRecipient(tx.accountToCredit.address);
    await this.continueButton.click();
    await this.cryptoAmountField.fill(tx.amount);
    await this.countinueSendAmount();
  }

  @step("Verify tx information before confirming")
  async expectTxInfoValidity(tx: Transaction) {
    await expect(this.totalDebitValue).toBeVisible();
    const displayedReceiveAddress = await this.recipientAddressDisplayedValue.innerText();
    expect(displayedReceiveAddress).toEqual(tx.accountToCredit.address);

    const displayedAmount = await this.amountDisplayedValue.innerText();
    expect(displayedAmount).toEqual(expect.stringContaining(tx.amount));
  }

  @step("Verify tx sent text")
  async expectTxSent() {
    await expect(this.checkTransactionbroadcastLabel).toBeVisible();
  }

  @step("Check continue button disable and ASA error message visible")
  async checkASAError() {
    await expect(this.continueButton).toBeDisabled();
    await expect(this.ASAErrorMessage).toBeVisible();
  }

  @step("Check invalid address error message")
  async checkInvalidAddressError(tx: Transaction) {
    await expect(this.continueButton).toBeDisabled();
    await expect(
      this.invalidAddressErrorMessage(tx.accountToDebit.currency.deviceLabel),
    ).toBeVisible();
  }

  @step("Check continue button enable")
  async checkContinueButtonEnable() {
    await expect(this.continueButton).toBeEnabled();
  }

  @step("Fill amount")
  async fillAmount(tx: Transaction) {
    if (tx.amount == "send max") {
      await this.toggleMaxAmount();
    } else {
      await this.cryptoAmountField.fill(tx.amount);
    }
  }

  @step("Click `Continue` button")
  async clickContinue() {
    await this.continueButton.click();
  }

  @step("Check continue button disabled")
  async checkContinueButtonDisabled() {
    await expect(this.continueButton).toBeDisabled();
  }
}
