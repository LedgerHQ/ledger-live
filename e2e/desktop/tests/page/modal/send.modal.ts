import { expect } from "@playwright/test";
import { Modal } from "tests/component/modal.component";
import { step } from "tests/misc/reporters/step";
import { Transaction } from "@ledgerhq/live-e2e-shared/models/Transaction";

export class SendModal extends Modal {
  readonly recipientInput = this.page.getByTestId("send-recipient-input");
  readonly tagInput = this.page.getByTestId("memo-tag-input");
  private readonly checkDeviceLabel = this.page.getByTestId("device-signature-notice");
  private readonly checkTransactionbroadcastLabel = this.page.locator("text=Transaction sent");
  private recipientAddressDisplayedValue = this.page.getByTestId("recipient-address");
  private recipientEnsDisplayed = this.page.getByTestId("transaction-recipient-ens");
  private amountDisplayedValue = this.page.getByTestId("transaction-amount");
  private feeStrategy = (fee: string) => this.page.getByText(fee);
  private noTagButton = this.page.getByRole("button", { name: "Don’t add Tag" });
  private ENSAddressLabel = this.page.getByTestId("ens-address-sendModal");

  readonly cryptoAmountField = this.page.getByTestId("modal-amount-field");

  @step("Click `Continue` button")
  async clickContinueToDevice() {
    await this.continue();
    await expect(this.checkDeviceLabel).toBeVisible();
  }

  @step("Enter recipient as $0")
  async fillRecipient(recipient: string | undefined) {
    if (!recipient) {
      throw new Error("Recipient address is not set");
    }
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
    if (transaction.accountToCredit.ensName) {
      await this.fillRecipient(transaction.accountToCredit.ensName);
      const displayedAddress = await this.ENSAddressLabel.innerText();
      expect(displayedAddress).toEqual(transaction.accountToCredit.address);
    } else {
      await this.fillRecipient(transaction.accountToCredit.address);
    }

    if (transaction.memoTag && transaction.memoTag !== "noTag") {
      await this.tagInput.clear();
      await this.tagInput.fill(transaction.memoTag);
    }
  }

  @step("Fill tx information")
  async craftTx(tx: Transaction) {
    await this.fillRecipientInfo(tx);
    await this.continue();

    if (tx.memoTag === "noTag") {
      await this.noTagButton.click();
    }

    await this.cryptoAmountField.fill(tx.amount);

    if (tx.speed !== undefined) {
      await this.chooseFeeStrategy(tx.speed);
    }
  }

  @step("Verify tx information before confirming")
  async expectTxInfoValidity(tx: Transaction) {
    if (!tx.accountToCredit.address) {
      throw new Error("Recipient address is not set");
    }
    await expect(this.recipientAddressDisplayedValue).toHaveText(tx.accountToCredit.address);

    await expect(this.amountDisplayedValue).toContainText(tx.amount);
    await expect(this.amountDisplayedValue).toContainText(tx.accountToDebit.currency.ticker);

    if (tx.accountToCredit.ensName) {
      await expect(this.recipientEnsDisplayed).toHaveText(tx.accountToCredit.ensName);
    }
  }

  @step("Verify tx sent text")
  async expectTxSent() {
    await expect(this.checkTransactionbroadcastLabel).toBeVisible();
  }
}
