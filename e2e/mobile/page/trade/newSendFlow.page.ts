import { Step } from "jest-allure2-reporter/api";
import escapeRegExp from "lodash/escapeRegExp";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";

/**
 * Matches any text that contains the copy as-is, so an amount keeps the no-break space the app puts
 * before its ticker. Detox matches a text regex against the whole text, hence the padding.
 */
const containing = (text: string) => new RegExp(String.raw`^[\s\S]*${escapeRegExp(text)}[\s\S]*$`);

export default class NewSendFlowPage {
  @Step("Navigate to token send screen")
  async navigateToTokenSendScreen(parentAccountName: string, tokenAccount: Account) {
    await app.account.openViaDeeplink();
    await app.account.goToAccountByName(parentAccountName);
    await app.account.navigateToTokenInAccount(tokenAccount);
    await app.account.tapSend();
  }

  recipientInputId = "recipient-input";
  skipMemoContentId = "send-skip-memo-content";
  skipMemoConfirmId = "send-skip-memo-confirm";
  addressConfirmId = "new-send-flow-address-confirm";
  memoInputId = "send-memo-input";
  memoTypeSelectId = "send-memo-type-select";
  amountModeToggleId = "amount-mode-toggle";
  amountContinueEnabledButtonId = "enabled-amount-continue-button";
  signaturePromptId = "send-signature-prompt";
  successViewTransactionId = "send-confirmation-success-view-transaction";

  private readonly amountContinueDisabledButtonId = "disabled-amount-continue-button";
  private readonly successConfirmationId = "send-confirmation-success";
  private readonly sponsoredFeeNudgeId = "send-sponsored-fee-nudge";
  private readonly sponsoredFeeValueId = "send-sponsored-fee-value";
  private readonly sponsoredFeeErrorId = "send-sponsored-fee-error";
  private readonly feePaymentEntryId = "send-fee-payment-entry";
  private readonly feePaymentConfirmId = "send-fee-payment-confirm";
  private readonly feePaymentOptionId = (optionId: string) => `send-fee-payment-option-${optionId}`;
  private readonly sponsoredRentSignaturePromptId = "send-sponsored-rent-signature-prompt";
  private readonly sponsoredPollingId = "send-sponsored-polling";
  private readonly sponsoredFailureId = "send-sponsored-failure";
  private readonly sponsoredFailureRetryId = "send-sponsored-failure-retry";
  private readonly sponsoredFailureRetryBlockedId = "send-sponsored-failure-retry-blocked";
  private readonly sponsoredFailureCancelId = "send-sponsored-failure-cancel";
  private readonly amountInputId = "amount-input";
  private readonly retryLockedNotice = () => getElementById(this.sponsoredFailureRetryBlockedId);
  private readonly textContaining = (text: string) => getElementByText(containing(text));
  private readonly feePaymentOptionShowing = (optionId: string, text: string) =>
    getElementByIdWithDescendantTexts(this.feePaymentOptionId(optionId), containing(text));
  private readonly sponsoredFeeErrorShowing = (text: string) =>
    getElementByIdAndText(this.sponsoredFeeErrorId, containing(text));
  private readonly sponsoredFailureRetryShowing = (text: string) =>
    getElementByIdWithDescendantTexts(this.sponsoredFailureRetryId, containing(text));

  contactAddressPickerId = "pay-contact-address-picker";
  recipientCardAvatarId = "send-recipient-card-avatar";
  recipientCardTitleId = "send-recipient-card-title";
  recipientCardSendId = "send-recipient-card-send";
  recipientCardAddContactId = "send-recipient-card-add-contact";
  recipientContactNameId = "recipient-contact-name";
  contactCompactRowId = (contactId: string) => `contacts-compact-row-${contactId}`;
  contactAddressRowId = (addressId: string) => `pay-contact-address-row-${addressId}`;

  @Step("Fill recipient address and continue: {{{0}}}")
  async setRecipientAndContinueNewFlow(address: string | undefined, memoTag?: string) {
    if (!address) throw new Error("Recipient address is not set");
    await typeTextById(this.recipientInputId, address);

    if (memoTag && memoTag !== "noTag") {
      await waitForElementById(this.memoInputId);
      await typeTextById(this.memoInputId, memoTag);
    }

    await tapById(this.addressConfirmId);

    if (memoTag === "noTag") {
      await waitForFullyVisibleById(this.skipMemoContentId);
      await tapById(this.skipMemoConfirmId);
      const dismissed = await waitForElementNotVisible(this.skipMemoContentId);
      jestExpect(dismissed).toBe(true);
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
    await this.tapReviewNewFlow();
  }

  @Step("Click review")
  async tapReviewNewFlow() {
    await waitForElementById(this.amountContinueEnabledButtonId);
    await tapById(this.amountContinueEnabledButtonId);
  }

  @Step("Verify review button is disabled")
  async expectReviewDisabled() {
    await waitForElementById(this.amountContinueDisabledButtonId);
  }

  @Step("Verify the sponsored fee offer is shown")
  async expectSponsoredNudgeVisible() {
    await waitForElementById(this.sponsoredFeeNudgeId);
  }

  @Step("Open the fee payment options")
  async openFeePayment() {
    await tapById(this.feePaymentEntryId);
    // Confirm ends the sheet, so it is fully on screen only once the sheet has slid all the way up.
    await waitForFullyVisibleById(this.feePaymentConfirmId);
  }

  /**
   * Matched within the whole option card. React Native mounts a text's native view under the
   * nearest ancestor that forms a stacking context, like this accessible card, so a container that
   * only carries a testID, like the fee's own, has no texts below it to match.
   */
  @Step("Verify fee payment option {{{0}}} costs {{{1}}}")
  async expectFeePaymentOptionFee(optionId: string, fee: string) {
    await waitForElement(this.feePaymentOptionShowing(optionId, fee));
  }

  @Step("Select fee payment option: {{{0}}}")
  async selectFeePaymentOption(optionId: string) {
    await tapById(this.feePaymentOptionId(optionId));
  }

  @Step("Confirm the fee payment option")
  async confirmFeePayment() {
    await tapById(this.feePaymentConfirmId);
    jestExpect(await waitForElementNotVisible(this.feePaymentConfirmId)).toBe(true);
  }

  @Step("Pay the network fee with fee payment option: {{{0}}}")
  async payFeeWith(optionId: string) {
    await this.openFeePayment();
    await this.selectFeePaymentOption(optionId);
    await this.confirmFeePayment();
  }

  @Step("Verify the network fee is paid with the sponsored option")
  async expectSponsoredFeeSelected() {
    await waitForElementById(this.sponsoredFeeValueId);
  }

  @Step("Verify sponsored fee error: {{{0}}}")
  async expectSponsoredFeeError(message: string) {
    await waitForElement(this.sponsoredFeeErrorShowing(message));
  }

  @Step("Wait for the rent payment signature screen")
  async waitForRentSignature() {
    await waitForElementById(this.sponsoredRentSignaturePromptId);
  }

  @Step("Verify the energy delivery wait is shown")
  async expectSponsoredPolling() {
    await waitForElementById(this.sponsoredPollingId);
  }

  /** The screen's testID container has no texts below it natively, so the copy is matched alone. */
  @Step("Verify the sponsored send failed: {{{0}}}")
  async expectSponsoredFailure(message: string) {
    await waitForElementById(this.sponsoredFailureId);
    await waitForElement(this.textContaining(message));
  }

  /**
   * Detox reads "enabled" on iOS from the view's user interaction, which a disabled button keeps, so
   * this presses Retry instead: a locked one leaves the failure screen in place.
   */
  @Step("Verify Retry is locked while the paid rent may still land")
  async expectRetryLocked() {
    await waitForElement(this.retryLockedNotice());
    await tapById(this.sponsoredFailureRetryId);
    await waitForElement(this.retryLockedNotice());
  }

  @Step("Verify Retry is offered as {{{0}}}, without the message: {{{1}}}")
  async expectRetryOffered(label: string, absentMessage: string) {
    await waitForElement(this.sponsoredFailureRetryShowing(label));
    await detoxExpect(this.retryLockedNotice()).not.toExist();
    await detoxExpect(this.textContaining(absentMessage)).not.toExist();
  }

  @Step("Cancel the failed sponsored send")
  async cancelSponsoredFailure() {
    await tapById(this.sponsoredFailureCancelId);
    jestExpect(await waitForElementNotVisible(this.sponsoredFailureId)).toBe(true);
    jestExpect(await waitForElementNotVisible(this.amountInputId)).toBe(true);
  }

  @Step("Wait for signature screen or device action loader")
  async waitForSignature() {
    await waitForElementById(this.signaturePromptId);
  }

  @Step("Clear the recipient input (stay on recipient step)")
  async clearRecipientNewFlow() {
    await clearTextByElement(getElementById(this.recipientInputId));
  }

  @Step("Send to the matched recipient")
  async tapRecipientCardSend() {
    await waitForElementById(this.recipientCardSendId);
    await tapById(this.recipientCardSendId);
  }

  @Step("Select contact {{{0}}} from the recipient search results")
  async selectContactFromSearchResults(contactId: string) {
    await waitForElementById(this.contactCompactRowId(contactId));
    await tapById(this.contactCompactRowId(contactId));
  }

  @Step("Select address {{{0}}} from the contact address picker")
  async selectContactAddress(addressId: string) {
    await waitForFullyVisibleById(this.contactAddressPickerId);
    await tapById(this.contactAddressRowId(addressId));
  }

  @Step("Expect the matched recipient card for contact: {{{0}}}")
  async expectMatchedContactCard(contactName: string) {
    await waitForElementById(this.recipientCardAvatarId);
    const actualTitle = await getTextOfElement(this.recipientCardTitleId);
    jestExpect(actualTitle).toEqual(contactName);
  }

  @Step("Expect the Add contact action to be enabled")
  async expectAddContactEnabled() {
    await waitForElementById(this.recipientCardAddContactId);
    const { enabled } = await getAttributesOfElement(this.recipientCardAddContactId);
    jestExpect(enabled).toBe(true);
  }

  @Step("Expect the amount step recipient is contact: {{{0}}}")
  async expectAmountStepContact(contactName: string) {
    await waitForElementById(this.recipientContactNameId);
    const actualName = await getTextOfElement(this.recipientContactNameId);
    jestExpect(actualName).toEqual(contactName);
  }

  @Step("Wait for the success confirmation screen")
  async waitForSuccessConfirmation() {
    await waitForElementById(this.successConfirmationId);
  }

  @Step("Wait for and tap success confirmation screen")
  async tapViewTransaction() {
    await waitForElementById(this.successViewTransactionId);
    await tapById(this.successViewTransactionId);
  }
}
