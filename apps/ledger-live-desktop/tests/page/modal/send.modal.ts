import { expect } from "@playwright/test";
import { Modal } from "../../component/modal.component";
import { step } from "tests/misc/reporters/step";
import { NFTTransaction, Transaction } from "../../models/Transaction";

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
  private recipientEnsDisplayed = this.page.getByTestId("transaction-recipient-ens");
  private amountDisplayedValue = this.page.getByTestId("transaction-amount");
  private nftNameDisplayed = this.page.getByTestId("transaction-nft-name");
  private feeStrategy = (fee: string) => this.page.getByText(fee);
  private noTagButton = this.page.getByRole("button", { name: "Don’t add Tag" });
  private ENSAddressLabel = this.page.getByTestId("ens-address-sendModal");

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

  @step("choose fee startegy")
  async chooseFeeStrategy(fee: string | undefined) {
    if (fee) {
      await this.feeStrategy(fee).click();
    }
  }

  @step("Enter recipient and tag")
  async fillRecipientInfo(transaction: Transaction) {
    await this.fillRecipient(transaction.accountToCredit.address);
    if (transaction.memoTag && transaction.memoTag !== "noTag") {
      await this.tagInput.clear();
      await this.tagInput.fill(transaction.memoTag);
    }
  }

  @step("Craft NFT tx")
  async craftNFTTx(tx: NFTTransaction) {
    await this.fillRecipient(tx.accountToCredit.ensName || tx.accountToCredit.address);
    const displayedAddress = await this.ENSAddressLabel.innerText();
    expect(displayedAddress).toEqual(tx.accountToCredit.address);
    await this.continueButton.click();
    await this.chooseFeeStrategy(tx.speed);
    await this.continueButton.click();
  }

  @step("Fill tx information")
  async craftTx(tx: Transaction) {
    await this.fillRecipientInfo(tx);
    await this.continueButton.click();

    if (tx.memoTag === "noTag") {
      await this.noTagButton.click();
    }

    await this.cryptoAmountField.fill(tx.amount);

    if (tx.speed !== undefined) {
      await this.chooseFeeStrategy(tx.speed);
    }
  }

  @step("Verify tx information before confirming")
  async expectNFTTxInfoValidity(tx: NFTTransaction) {
    const displayedEns = await this.recipientEnsDisplayed.innerText();
    expect(displayedEns).toEqual(tx.accountToCredit.ensName);

    const displayedReceiveAddress = await this.recipientAddressDisplayedValue.innerText();
    expect(displayedReceiveAddress).toEqual(tx.accountToCredit.address);

    const displayedNftName = await this.nftNameDisplayed.innerText();
    expect(displayedNftName).toEqual(expect.stringContaining(tx.nft.nftName));
    await this.continueButton.click();
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
