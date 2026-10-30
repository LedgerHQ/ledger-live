import { Step } from "jest-allure2-reporter/api";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { escapeRegExp } from "@e2e/helpers/commonHelpers";
import { byId, byIdAndText, byIdWithDescendantText } from "@e2e/helpers/elements/native";
import { retryUntilTimeout } from "@e2e/utils/retry";
import { TIMEOUT } from "@e2e/utils/timeouts";

const wholeTextContaining = (text: string) =>
  new RegExp(String.raw`^[\s\S]*${escapeRegExp(text)}[\s\S]*$`);
/** The number before the TRX code; NaN when the text shows no TRX amount. */
const trxAmount = (text: string): number => {
  const words = text.trim().split(/\s+/);
  const code = words.indexOf("TRX");
  return code > 0 ? Number(words[code - 1].replaceAll(",", "")) : Number.NaN;
};

export default class NewSendFlowPage {
  private readonly recipientInput = byId("recipient-input");
  private readonly skipMemoContent = byId("send-skip-memo-content");
  private readonly skipMemoConfirm = byId("send-skip-memo-confirm");
  private readonly addressConfirm = byId("new-send-flow-address-confirm");
  private readonly memoInput = byId("send-memo-input");
  private readonly memoTypeSelect = byId("send-memo-type-select");
  private readonly memoTypeOption = (value: string) => byId(`send-memo-type-option-${value}`);
  private readonly amountModeToggle = byId("amount-mode-toggle");
  private readonly keyboardKey = (char: string) =>
    byId(char === "." ? "keyboard-key-decimal" : `keyboard-key-${char}`);
  private readonly amountContinueButton = byId("enabled-amount-continue-button");
  private readonly signaturePrompt = byId("send-signature-prompt");
  private readonly successViewTransaction = byId("send-confirmation-success-view-transaction");

  private readonly amountContinueDisabledButton = byId("disabled-amount-continue-button");
  private readonly amountInput = byId("amount-input");
  private readonly successConfirmation = byId("send-confirmation-success");
  private readonly sponsoredFeeNudge = byId("send-sponsored-fee-nudge");
  private readonly sponsoredFeeValue = byId("send-sponsored-fee-value");
  private readonly sponsoredFeeErrorShowing = (text: string) =>
    byIdAndText("send-sponsored-fee-error", wholeTextContaining(text));
  private readonly feePaymentEntry = byId("send-fee-payment-entry");
  private readonly networkFeesValue = byId("send-network-fees-value");
  private readonly networkFeesSecondaryValue = byId("send-network-fees-secondary-value");
  private readonly sponsoredRentArriving = byId("send-sponsored-rent-arriving");
  private readonly feePaymentOptionsContent = byId("send-fee-payment-options");
  private readonly feePaymentConfirm = byId("send-fee-payment-confirm");
  private readonly feePaymentOption = (optionId: string) =>
    byId(`send-fee-payment-option-${optionId}`);
  // A string matches the whole text, so "0.85 USDT" doesn't match "10.85 USDT".
  private readonly feePaymentOptionFeeShowing = (optionId: string, fee: string) =>
    byIdWithDescendantText(`send-fee-payment-option-${optionId}-fee`, fee);
  private readonly sponsoredRentSignaturePrompt = byId("send-sponsored-rent-signature-prompt");
  private readonly sponsoredPolling = byId("send-sponsored-polling");
  private readonly sponsoredFailure = byId("send-sponsored-failure");
  private readonly sponsoredFailureMessageShowing = (text: string) =>
    byIdAndText("send-sponsored-failure-description", wholeTextContaining(text));
  private readonly sponsoredFailureRetry = byId("send-sponsored-failure-retry");
  private readonly sponsoredFailureRetryShowing = (text: string) =>
    byIdWithDescendantText("send-sponsored-failure-retry", wholeTextContaining(text));
  private readonly retryBlockedBanner = byId("send-sponsored-failure-retry-blocked");
  private readonly sponsoredFailureCancel = byId("send-sponsored-failure-cancel");

  private readonly contactAddressPicker = byId("pay-contact-address-picker");
  private readonly recipientCardAvatar = byId("send-recipient-card-avatar");
  private readonly recipientCardTitle = byId("send-recipient-card-title");
  private readonly recipientCardSend = byId("send-recipient-card-send");
  private readonly recipientCardAddContact = byId("send-recipient-card-add-contact");
  private readonly recipientContactName = byId("recipient-contact-name");
  private readonly contactCompactRow = (contactId: string) =>
    byId(`contacts-compact-row-${contactId}`);
  private readonly contactAddressRow = (addressId: string) =>
    byId(`pay-contact-address-row-${addressId}`);

  @Step("Navigate to token send screen")
  async navigateToTokenSendScreen(parentAccountName: string, tokenAccount: Account) {
    await app.account.openViaDeeplink();
    await app.account.goToAccountByName(parentAccountName);
    await app.account.navigateToTokenInAccount(tokenAccount);
    await app.account.tapSend();
  }

  @Step("Fill recipient address and continue: {{{0}}}")
  async setRecipientAndContinueNewFlow(address: string | undefined, memoTag?: string) {
    if (!address) throw new Error("Recipient address is not set");
    await this.recipientInput.replaceText(address);

    if (memoTag && memoTag !== "noTag") {
      await this.memoInput.replaceText(memoTag);
    }

    await this.addressConfirm.tap();

    if (memoTag === "noTag") {
      await this.skipMemoContent.waitFullyVisible();
      await this.skipMemoConfirm.tap();
      await this.skipMemoContent.waitNotVisible();
    }
  }

  @Step("Type recipient address (stay on recipient step): {{{0}}}")
  async typeRecipientNewFlow(address: string | undefined) {
    if (!address) throw new Error("Recipient address is not set");
    await this.recipientInput.replaceText(address);
  }

  @Step("Open memo type dropdown and expect options: {{{0}}}")
  async expectMemoTypeOptions(optionValues: string[]) {
    await this.memoTypeSelect.tap();
    for (const optionValue of optionValues) {
      await this.memoTypeOption(optionValue).waitVisible();
    }
  }

  @Step("Expect memo field to reject non-numeric input: {{{0}}}")
  async expectMemoRejectsNonNumericInput(rawInput: string, expectedSanitizedValue = "") {
    await this.memoInput.replaceText(rawInput);
    // XRP tags are numeric-only: non-digits are stripped by sanitizeMemoValue, so the
    // field never holds the rejected characters.
    const actualValue = await this.memoInput.getText();
    jestExpect(actualValue).toEqual(expectedSanitizedValue);
  }

  @Step("Expect memo field to retain numeric input: {{{0}}}")
  async expectMemoRetainsNumericInput(numericInput: string) {
    await this.memoInput.replaceText(numericInput);
    const actualValue = await this.memoInput.getText();
    jestExpect(actualValue).toEqual(numericInput);
  }

  @Step("Fill crypto amount: {{{0}}}")
  async setAmountNewFlow(amount: string) {
    // The amount step opens in fiat mode, so an untoggled "0.01" is $0.01, not 0.01 crypto —
    // the Speculos assertions compare against the crypto amount.
    await this.amountModeToggle.tap();
    for (const char of amount) {
      await this.keyboardKey(char).tap();
    }
  }

  @Step("Click review to proceed to signature {{{0}}}")
  async setAmountAndReviewNewFlow(amount: string) {
    await this.setAmountNewFlow(amount);
    await this.tapReviewNewFlow();
  }

  @Step("Click review")
  async tapReviewNewFlow() {
    await this.amountContinueButton.tap();
  }

  @Step("Verify review button is disabled")
  async expectReviewDisabled() {
    await this.amountContinueDisabledButton.waitVisible();
  }

  @Step("Verify the sponsored fee offer is shown")
  async expectSponsoredNudgeVisible() {
    await this.sponsoredFeeNudge.waitVisible();
  }

  @Step("Open the fee payment options")
  async openFeePayment() {
    await this.feePaymentEntry.tap();
    await this.feePaymentOptionsContent.waitFullyVisible();
  }

  @Step("Verify fee payment option {{{0}}} costs {{{1}}}")
  async expectFeePaymentOptionFee(optionId: string, fee: string) {
    await this.feePaymentOptionFeeShowing(optionId, fee).waitVisible();
  }

  @Step("Select fee payment option: {{{0}}}")
  async selectFeePaymentOption(optionId: string) {
    await this.feePaymentOption(optionId).tap();
  }

  @Step("Confirm the fee payment option")
  async confirmFeePayment() {
    await this.feePaymentConfirm.tap();
    await this.feePaymentConfirm.waitGone();
  }

  @Step("Pay the network fee with fee payment option: {{{0}}}")
  async payFeeWith(optionId: string) {
    await this.openFeePayment();
    await this.selectFeePaymentOption(optionId);
    await this.confirmFeePayment();
  }

  @Step("Verify the network fee is paid with the sponsored option")
  async expectSponsoredFeeSelected() {
    await this.sponsoredFeeValue.waitVisible();
  }

  @Step("Verify sponsored fee error: {{{0}}}")
  async expectSponsoredFeeError(message: string) {
    await this.sponsoredFeeErrorShowing(message).waitVisible();
  }

  @Step("Verify the paid rent is shown as arriving")
  async expectRentArriving() {
    await this.sponsoredRentArriving.waitVisible();
  }

  @Step("Verify no rent is offered")
  async expectNoFeePaymentOffer() {
    await this.feePaymentEntry.waitGone();
  }

  // TRX is the main value without a countervalue, else the secondary value after the fiat one.
  // NaN while the fee shows no TRX amount yet, which no comparison passes.
  private async networkFeeTrx(): Promise<number> {
    const main = trxAmount(await this.networkFeesValue.getText());
    return Number.isNaN(main) ? trxAmount(await this.networkFeesSecondaryValue.getText()) : main;
  }

  private waitForNetworkFeeTrx(passes: (fee: number) => boolean, expected: string) {
    return retryUntilTimeout(async () => {
      const fee = await this.networkFeeTrx();
      if (!passes(fee)) throw new Error(`The network fee is ${fee} TRX, expected ${expected}`);
      return fee;
    });
  }

  @Step("Read the network fee in TRX once it is estimated for the amount")
  async settledNetworkFeeTrx(): Promise<number> {
    await this.amountContinueButton.waitVisible();
    return this.waitForNetworkFeeTrx(fee => fee > 0, "above 0 TRX");
  }

  @Step("Verify the network fee dropped below {{{0}}} TRX once the rent landed")
  async expectFeeDroppedOnRentDelivery(feeBefore: number) {
    await this.sponsoredRentArriving.waitGone();
    await this.waitForNetworkFeeTrx(fee => fee < feeBefore, `below ${feeBefore} TRX`);
  }

  @Step("Wait for the rent payment signature screen")
  async waitForRentSignature() {
    await this.sponsoredRentSignaturePrompt.waitVisible();
  }

  @Step("Verify the energy delivery wait is shown")
  async expectSponsoredPolling() {
    await this.sponsoredPolling.waitVisible();
  }

  @Step("Verify the sponsored send failed: {{{0}}}")
  async expectSponsoredFailure(message: string) {
    await this.sponsoredFailure.waitVisible();
    await this.sponsoredFailureMessageShowing(message).waitVisible();
  }

  // A working Retry always leaves the failure screen, so a locked one must keep it up.
  @Step("Verify Retry is locked while the paid rent may still land")
  async expectRetryLocked() {
    await this.retryBlockedBanner.waitVisible();
    await this.sponsoredFailureRetry.tap();
    await jestExpect(this.sponsoredFailure.waitGone(TIMEOUT.small)).rejects.toThrow(
      "did not become hidden",
    );
    await this.retryBlockedBanner.waitVisible();
  }

  @Step("Verify Retry is offered as {{{0}}}, with no banner blocking it")
  async expectRetryOffered(label: string) {
    await this.sponsoredFailureRetryShowing(label).waitVisible();
    await this.retryBlockedBanner.waitGone();
  }

  @Step("Cancel the failed sponsored send")
  async cancelSponsoredFailure() {
    await this.sponsoredFailureCancel.tap();
    await this.sponsoredFailure.waitGone();
    await this.amountInput.waitGone();
  }

  @Step("Wait for signature screen or device action loader")
  async waitForSignature() {
    await this.signaturePrompt.waitVisible();
  }

  @Step("Clear the recipient input (stay on recipient step)")
  async clearRecipientNewFlow() {
    await this.recipientInput.clearText();
  }

  @Step("Send to the matched recipient")
  async tapRecipientCardSend() {
    await this.recipientCardSend.tap();
  }

  @Step("Select contact {{{0}}} from the recipient search results")
  async selectContactFromSearchResults(contactId: string) {
    await this.contactCompactRow(contactId).tap();
  }

  @Step("Select address {{{0}}} from the contact address picker")
  async selectContactAddress(addressId: string) {
    await this.contactAddressPicker.waitFullyVisible();
    await this.contactAddressRow(addressId).tap();
  }

  @Step("Expect the matched recipient card for contact: {{{0}}}")
  async expectMatchedContactCard(contactName: string) {
    await this.recipientCardAvatar.waitVisible();
    const actualTitle = await this.recipientCardTitle.getText();
    jestExpect(actualTitle).toEqual(contactName);
  }

  @Step("Expect the Add contact action to be enabled")
  async expectAddContactEnabled() {
    const { enabled } = await this.recipientCardAddContact.getAttributes();
    jestExpect(enabled).toBe(true);
  }

  @Step("Expect the amount step recipient is contact: {{{0}}}")
  async expectAmountStepContact(contactName: string) {
    const actualName = await this.recipientContactName.getText();
    jestExpect(actualName).toEqual(contactName);
  }

  @Step("Wait for the success confirmation screen")
  async waitForSuccessConfirmation() {
    await this.successConfirmation.waitVisible();
  }

  @Step("Wait for and tap success confirmation screen")
  async tapViewTransaction() {
    await this.successViewTransaction.tap();
  }
}
