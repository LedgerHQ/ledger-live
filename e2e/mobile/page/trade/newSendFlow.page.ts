import { Step } from "jest-allure2-reporter/api";

export default class NewSendFlowPage {
  recipientInputId = "recipient-input";
  skipMemoLinkId = "new-send-flow-skip-memo-link";
  skipMemoConfirmId = "new-send-flow-skip-memo-confirm";
  addressConfirmId = "new-send-flow-address-confirm";
  memoInputId = "send-memo-input";
  amountContinueEnabledButtonId = "enabled-amount-continue-button";
  signaturePromptId = "send-signature-prompt";
  successViewTransactionId = "send-confirmation-success-view-transaction";

  @Step("Type address in search input: $0")
  async setRecipientAndContinueNewFlow(address: string | undefined, memoTag?: string) {
    if (!address) throw new Error("Recipient address is not set");
    await typeTextById(this.recipientInputId, address);

    if (memoTag === "noTag") {
      if (await IsIdVisible(this.skipMemoLinkId)) {
        await tapById(this.skipMemoLinkId);
        await tapById(this.skipMemoConfirmId);
      } else {
        await tapById(this.addressConfirmId);
      }
    } else if (memoTag) {
      await waitForElementById(this.memoInputId);
      await typeTextById(this.memoInputId, memoTag);
      await tapById(this.addressConfirmId);
    } else {
      await tapById(this.addressConfirmId);
    }
  }

  @Step("Fill crypto amount: $0")
  async setAmountNewFlow(amount: string) {
    for (const char of amount) {
      const keyId = char === "." ? "keyboard-key-decimal" : `keyboard-key-${char}`;
      await tapById(keyId);
    }
  }

  @Step("Click review to proceed to signature")
  async setAmountAndReviewNewFlow(amount: string) {
    await this.setAmountNewFlow(amount);
    await waitForElementById(this.amountContinueEnabledButtonId);
    await tapById(this.amountContinueEnabledButtonId);
  }

  @Step("Wait for signature screen or device action loader")
  async waitForSignature() {
    await waitForElementById(this.signaturePromptId);
  }

  @Step("Wait success confirmation screen")
  async waitForSuccessConfirmation() {
    await waitForElementById(this.successViewTransactionId);
    await tapById(this.successViewTransactionId);
  }
}
