import { expect } from "@playwright/test";
import { Modal } from "../../component/modal.component";
import { step } from "tests/misc/reporters/step";
import { Transaction } from "../../models/Transaction";
import { Currency } from "tests/enum/Currency";

export class SendModal extends Modal {
  private drowdownAccount = this.page.locator('[data-testid="modal-content"] svg').nth(1);
  readonly recipientInput = this.page.getByTestId("send-recipient-input");
  readonly tagInput = this.page.getByTestId("memo-tag-input");
  readonly continueButton = this.page.getByRole("button", { name: "continue" });
  private checkDeviceLabel = this.page.locator(
    "text=Double-check the transaction details on your Ledger device before signing.",
  );
  private checkTransactionbroadcastLabel = this.page.locator("text=Transaction sent");
  private recipientAddressDisplayedValue = this.page.getByTestId("recipient-address");
  private amountDisplayedValue = this.page.getByTestId("transaction-amount");
  private feeStrategy = (fee: string) => this.page.getByText(fee);
  private noTagButton = this.page.getByRole("button", { name: "Don’t add Tag" });

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

  @step("Enter recipient and tag")
  async fillRecipientInfo(transaction: Transaction) {
    await this.fillRecipient(transaction.accountToCredit.address);
    if (transaction.memoTag) {
      await this.tagInput.clear();
      await this.tagInput.fill(transaction.memoTag);
    }
  }

  @step("Fill tx information")
  async craftTx(tx: Transaction) {
    const memotagModalCurrencies = [Currency.XLM, Currency.ADA, Currency.ATOM];
    const feeStrategyCurrencies = [Currency.sepETH, Currency.POL, Currency.DOGE, Currency.BCH];

    await this.fillRecipientInfo(tx);
    await this.continueButton.click();

    if (memotagModalCurrencies.includes(tx.accountToDebit.currency)) {
      await this.noTagButton.click();
    }

    await this.cryptoAmountField.fill(tx.amount);

    if (feeStrategyCurrencies.includes(tx.accountToDebit.currency)) {
      await this.feeStrategy(tx.speed).click();
    }

    await this.countinueSendAmount();
  }

  @step("Verify tx information before confirming")
  async expectTxInfoValidity(tx: Transaction) {
    const displayedReceiveAddress = await this.recipientAddressDisplayedValue.innerText();
    expect(displayedReceiveAddress).toEqual(tx.accountToCredit.address);

    const displayedAmount = await this.amountDisplayedValue.innerText();
    expect(displayedAmount).toEqual(expect.stringContaining(tx.amount));
  }

  @step("Verify tx sent text")
  async expectTxSent() {
    await expect(this.checkTransactionbroadcastLabel).toBeVisible();
  }

  @step("Check continue button enable")
  async checkContinueButtonEnable() {
    await expect(this.continueButton).toBeEnabled();
  }

  @step("Click `Continue` button")
  async clickContinue() {
    await this.continueButton.click();
  }

  @step("Check continue button disabled")
  async checkContinueButtonDisabled() {
    await expect(this.continueButton).toBeDisabled();
  }

  @step("Fill amount $0")
  async fillAmount(amount: string) {
    if (amount == "send max") {
      await this.toggleMaxAmount();
    } else {
      await this.cryptoAmountField.fill(amount);
    }
  }
}
