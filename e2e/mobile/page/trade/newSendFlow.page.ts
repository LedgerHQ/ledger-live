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

  recipientCardId = "send-recipient-card";
  recipientCardTitleId = "send-recipient-card-title";
  recipientCardSendId = "send-recipient-card-send";
  recipientCardAddContactId = "send-recipient-card-add-contact";
  addContactStepId = "send-add-contact-step";
  addContactNewId = "send-add-contact-new";
  contactNameInputId = "contacts-add-contact-name-input";
  contactNameSaveId = "contacts-add-contact-save";
  addressLabelInputId = "contacts-add-address-name-input";
  addressLabelContinueId = "contacts-add-address-name-continue";
  addressReviewContinueId = "contacts-add-address-review-continue";
  recipientContactRowId = "recipient-contact-row";
  recipientContactNameId = "recipient-contact-name";

  @Step("Fill recipient address and continue: {{{0}}}")
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

  @Step("Type recipient address (stay on recipient step): {{{0}}}")
  async typeRecipientNewFlow(address: string | undefined) {
    if (!address) throw new Error("Recipient address is not set");
    await typeTextById(this.recipientInputId, address);
  }

  @Step("Open memo type dropdown and expect options: {{{0}}}")
  async expectMemoTypeOptions(optionValues: string[]) {
    await waitForElementById(this.memoTypeSelectId);
    await tapById(this.memoTypeSelectId);
    for (const optionValue of optionValues) {
      await waitForElementById(`send-memo-type-option-${optionValue}`);
    }
  }

  @Step("Expect memo field to reject non-numeric input: {{{0}}}")
  async expectMemoRejectsNonNumericInput(rawInput: string, expectedSanitizedValue = "") {
    await waitForElementById(this.memoInputId);
    await typeTextById(this.memoInputId, rawInput);
    // XRP tags are numeric-only: non-digits are stripped by sanitizeMemoValue, so the
    // field never holds the rejected characters.
    const actualValue = await getTextOfElement(this.memoInputId);
    jestExpect(actualValue).toEqual(expectedSanitizedValue);
  }

  @Step("Expect memo field to retain numeric input: {{{0}}}")
  async expectMemoRetainsNumericInput(numericInput: string) {
    await waitForElementById(this.memoInputId);
    await typeTextById(this.memoInputId, numericInput);
    const actualValue = await getTextOfElement(this.memoInputId);
    jestExpect(actualValue).toEqual(numericInput);
  }

  @Step("Fill crypto amount: {{{0}}}")
  async setAmountNewFlow(amount: string) {
    // The amount step opens in fiat mode, so an untoggled "0.01" is $0.01, not 0.01 crypto —
    // the Speculos assertions compare against the crypto amount.
    await tapById(this.amountModeToggleId);
    for (const char of amount) {
      const keyId = char === "." ? "keyboard-key-decimal" : `keyboard-key-${char}`;
      await tapById(keyId);
    }
  }

  @Step("Click review to proceed to signature {{{0}}}")
  async setAmountAndReviewNewFlow(amount: string) {
    await this.setAmountNewFlow(amount);
    await waitForElementById(this.amountContinueEnabledButtonId);
    await tapById(this.amountContinueEnabledButtonId);
  }

  @Step("Wait for signature screen or device action loader")
  async waitForSignature() {
    await waitForElementById(this.signaturePromptId);
  }

  @Step("Clear the recipient input (stay on recipient step)")
  async clearRecipientNewFlow() {
    await clearTextByElement(getElementById(this.recipientInputId));
  }

  @Step("Add a new contact named {{{0}}} with address label {{{1}}} from the recipient step")
  async createContactFromRecipientStep(name: string, addressLabel: string) {
    await waitForElementById(this.recipientCardAddContactId);
    await tapById(this.recipientCardAddContactId);
    await waitForFullyVisibleById(this.addContactStepId);
    await tapById(this.addContactNewId);
    await typeTextById(this.contactNameInputId, name);
    await tapById(this.contactNameSaveId);
    await waitForElementById(this.addressLabelInputId);
    await typeTextById(this.addressLabelInputId, addressLabel);
    await tapById(this.addressLabelContinueId);
    await waitForElementById(this.addressReviewContinueId);
    await tapByIdAndExpectToDisappear(this.addressReviewContinueId);
  }

  @Step("Expect the matched recipient card for contact: {{{0}}}")
  async expectMatchedContactCard(contactName: string) {
    await waitForElementById(this.recipientCardId);
    const actualTitle = await getTextOfElement(this.recipientCardTitleId);
    jestExpect(actualTitle).toEqual(contactName);
  }

  @Step("Confirm the matched recipient card and continue")
  async confirmMatchedContact() {
    await waitForElementById(this.recipientCardSendId);
    await tapById(this.recipientCardSendId);
  }

  @Step("Expect the Add contact action to be enabled")
  async expectAddContactEnabled() {
    await waitForElementById(this.recipientCardId);
    const { enabled } = await getAttributesOfElement(this.recipientCardAddContactId);
    jestExpect(enabled).toBe(true);
  }

  @Step("Expect the amount step recipient is contact: {{{0}}}")
  async expectAmountStepContact(contactName: string) {
    await waitForElementById(this.recipientContactRowId);
    const actualName = await getTextOfElement(this.recipientContactNameId);
    jestExpect(actualName).toEqual(contactName);
  }

  @Step("Wait for and tap success confirmation screen")
  async tapViewTransaction() {
    await waitForElementById(this.successViewTransactionId);
    await tapById(this.successViewTransactionId);
  }
}
