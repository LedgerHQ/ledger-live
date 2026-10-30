import { Step } from "jest-allure2-reporter/api";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { byId } from "@e2e/helpers/elements/native";

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
    await this.amountContinueButton.tap();
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

  @Step("Wait for and tap success confirmation screen")
  async tapViewTransaction() {
    await this.successViewTransaction.tap();
  }
}
