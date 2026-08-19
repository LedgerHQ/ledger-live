import { Step } from "jest-allure2-reporter/api";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";

export default class NewSendFlowPage {
  @Step("Navigate to token send screen")
  async navigateToTokenSendScreen(parentAccountName: string, tokenAccount: Account) {
    await app.account.openViaDeeplink();
    await app.account.goToAccountByName(parentAccountName);
    await app.account.navigateToTokenInAccount(tokenAccount);
    await app.account.tapSend();
  }

  recipientInputId = "recipient-input";
  skipMemoLinkId = "new-send-flow-skip-memo-link";
  skipMemoConfirmId = "new-send-flow-skip-memo-confirm";
  addressConfirmId = "new-send-flow-address-confirm";
  memoInputId = "send-memo-input";
  memoTypeSelectId = "send-memo-type-select";
  amountModeToggleId = "amount-mode-toggle";
  amountContinueEnabledButtonId = "enabled-amount-continue-button";
  signaturePromptId = "send-signature-prompt";
  successViewTransactionId = "send-confirmation-success-view-transaction";

  @Step("Fill recipient address and continue: $0")
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

  @Step("Type recipient address (stay on recipient step): $0")
  async typeRecipientNewFlow(address: string | undefined) {
    if (!address) throw new Error("Recipient address is not set");
    await typeTextById(this.recipientInputId, address);
  }

  @Step("Open memo type dropdown and expect options: $0")
  async expectMemoTypeOptions(optionValues: string[]) {
    await waitForElementById(this.memoTypeSelectId);
    await tapById(this.memoTypeSelectId);
    for (const optionValue of optionValues) {
      await waitForElementById(`send-memo-type-option-${optionValue}`);
    }
  }

  @Step("Expect memo field to reject non-numeric input: $0")
  async expectMemoRejectsNonNumericInput(rawInput: string, expectedSanitizedValue = "") {
    await waitForElementById(this.memoInputId);
    await typeTextById(this.memoInputId, rawInput);
    // XRP tags are numeric-only: non-digits are stripped by sanitizeMemoValue, so the
    // field never holds the rejected characters.
    const actualValue = await getTextOfElement(this.memoInputId);
    jestExpect(actualValue).toEqual(expectedSanitizedValue);
  }

  @Step("Expect memo field to retain numeric input: $0")
  async expectMemoRetainsNumericInput(numericInput: string) {
    await waitForElementById(this.memoInputId);
    await typeTextById(this.memoInputId, numericInput);
    const actualValue = await getTextOfElement(this.memoInputId);
    jestExpect(actualValue).toEqual(numericInput);
  }

  @Step("Fill crypto amount: $0")
  async setAmountNewFlow(amount: string) {
    // The amount step opens in fiat mode, so an untoggled "0.01" is $0.01, not 0.01 crypto —
    // the Speculos assertions compare against the crypto amount.
    await tapById(this.amountModeToggleId);
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

  @Step("Wait for and tap success confirmation screen")
  async tapViewTransaction() {
    await waitForElementById(this.successViewTransactionId);
    await tapById(this.successViewTransactionId);
  }
}
