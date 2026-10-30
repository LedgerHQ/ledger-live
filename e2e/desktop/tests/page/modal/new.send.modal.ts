import { expect } from "@playwright/test";
import { Fee } from "@ledgerhq/live-e2e-shared/enum/Fee";
import type { AccountType } from "@ledgerhq/live-e2e-shared/enum/Account";
import { STELLAR_MEMO_TYPE_LABELS, StellarMemoType } from "@ledgerhq/live-e2e-shared/enum/MemoType";
import { SEND_ADDRESS_FORMAT_OPTIONS } from "@ledgerhq/live-common/flows/send/utils";
import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";
import { step } from "tests/misc/reporters/step";
import { Modal } from "tests/component/modal.component";
import { looksLikeFiatValue } from "tests/utils/looksLikeFiatValue";

export class NewSendModal extends Modal {
  readonly dialog = this.page.getByRole("dialog");
  private readonly backButton = this.dialog
    .getByTestId("send-dialog-header")
    .getByRole("button", { name: "Go back" });

  readonly recipientInput = this.dialog.getByTestId("send-recipient-input");
  readonly matchedAddressButtons = this.dialog
    .locator('[data-testid="send-matched-address-button"]')
    .filter({ visible: true });
  private readonly recipientDisplay = this.dialog.getByTestId("send-recipient-display");
  private readonly recipientContactAvatar = this.dialog.getByTestId(
    "send-recipient-contact-avatar",
  );
  private readonly recipientCard = this.dialog.getByTestId("send-recipient-card");
  private readonly recipientCardAddContactButton = this.dialog.getByTestId(
    "send-recipient-card-add-contact",
  );
  readonly recipientStep = this.dialog.getByTestId("send-recipient-step");
  readonly validationStatusMessage = this.dialog.getByTestId("address-validation-status");
  readonly recipientErrorBanner = this.dialog.getByTestId("recipient-error-banner");
  readonly recipientWarningBanner = this.dialog.getByTestId("recipient-warning-banner");
  private readonly recentHistoryWarning = this.dialog.getByTestId("send-recent-history-warning");
  readonly memoInput = this.dialog.getByTestId("send-memo-input");
  private readonly memoTypeSelect = this.dialog.getByTestId("send-memo-options-select");
  // Select options render in a portal, outside the dialog subtree.
  private readonly memoTypeOption = (memoType: StellarMemoType) =>
    this.page.getByTestId(`send-memo-select-option-${memoType}`);
  readonly skipMemoConfirmButton = this.dialog.getByTestId("send-skip-memo-confirm");
  private readonly skipMemoCancelButton = this.dialog.getByTestId("send-skip-memo-cancel");
  readonly amountInput = this.dialog.getByTestId("send-amount-input");
  readonly amountErrorMessage = this.dialog.getByTestId("send-amount-message");
  readonly quickActionMax = this.dialog.getByTestId("send-quick-actions-max");
  readonly feesMenuTrigger = this.dialog.getByTestId("send-network-fees-menu-trigger");
  readonly reviewButton = this.dialog.getByTestId("send-review-button");
  readonly getFundsButton = this.dialog.getByTestId("send-get-funds-button");
  readonly toggleInputModeButton = this.dialog.getByTestId("send-toggle-input-mode-button");
  readonly amountSecondaryValue = this.dialog.getByTestId("send-amount-secondary-value");
  readonly confirmationSuccessContent = this.dialog.getByTestId(
    "send-confirmation-success-content",
  );
  readonly confirmationErrorContent = this.dialog.getByTestId("send-confirmation-error-content");
  readonly confirmationInfoContent = this.dialog.getByTestId("send-confirmation-info-content");
  /**
   * Any of the three terminal confirmation screens (success, error, or info).
   * Use `waitForSuccessConfirmation()` when asserting success specifically.
   */
  readonly confirmationTerminalContent = this.confirmationSuccessContent
    .or(this.confirmationErrorContent)
    .or(this.confirmationInfoContent);
  readonly successConfirmationTitle = this.dialog.getByTestId("send-confirmation-success-title");
  readonly viewDetailsButton = this.dialog.getByTestId("send-confirmation-view-details-button");
  private readonly confirmationCloseButton = this.dialog.getByTestId(
    "send-confirmation-close-button",
  );
  readonly deviceActionLoader = this.page.getByTestId("device-action-loader");
  readonly signaturePrompt = this.dialog.getByTestId("send-signature-prompt");
  private readonly sponsoredFeeNudge = this.dialog.getByTestId("send-sponsored-fee-nudge");
  private readonly feePaymentEntry = this.dialog.getByTestId("send-fee-payment-entry");
  private readonly feePaymentConfirmButton = this.dialog.getByTestId("send-fee-payment-confirm");
  private readonly sponsoredFeeValue = this.dialog.getByTestId("send-sponsored-fee-value");
  private readonly sponsoredFeeError = this.dialog.getByTestId("send-sponsored-fee-error");
  private readonly sponsoredRentArriving = this.dialog.getByTestId("send-sponsored-rent-arriving");
  private readonly networkFeesRow = this.dialog.getByTestId("send-network-fees-row");
  private readonly sponsoredPolling = this.dialog.getByTestId("send-sponsored-polling");
  private readonly sponsoredFailure = this.dialog.getByTestId("send-sponsored-failure");
  private readonly sponsoredFailureRetry = this.dialog.getByTestId("send-sponsored-failure-retry");
  private readonly sponsoredFailureRetryBlocked = this.dialog.getByTestId(
    "send-sponsored-failure-retry-blocked",
  );
  private readonly sponsoredFailureCancel = this.dialog.getByTestId(
    "send-sponsored-failure-cancel",
  );
  private readonly notEnoughFeeTokenCopy = (ticker: string) =>
    this.dialog.getByText(`You don't have enough ${ticker}`);

  private readonly feePaymentOption = (optionId: string) =>
    this.dialog.getByTestId(`send-fee-payment-option-${optionId}`);
  private readonly feePaymentOptionFee = (optionId: string) =>
    this.dialog.getByTestId(`send-fee-payment-option-${optionId}-fee`);

  getFeePreset(preset: Fee) {
    return this.page.getByTestId(`send-fees-preset-${preset.toLowerCase()}`);
  }

  private readonly contactRow = (contactId: string) =>
    this.dialog.getByTestId(`contacts-compact-row-${contactId}`);

  private readonly contactAddressRow = (addressId: string) =>
    this.dialog.getByTestId(`send-recipient-contact-address-${addressId}`);

  private readonly balanceTypeOption = (optionId: string) =>
    this.dialog.getByTestId(`balance-type-${optionId}`);

  private async isCryptoInputMode(): Promise<boolean | null> {
    const secondaryValue = (await this.amountSecondaryValue.textContent())?.trim() ?? "";
    // Return null when the element isn't populated yet so callers can retry.
    if (!secondaryValue) return null;
    return looksLikeFiatValue(secondaryValue);
  }

  @step("Wait for send flow dialog to open")
  async waitForDialog() {
    await this.dialog.waitFor({ state: "visible" });
  }

  @step("Select balance type: $0")
  async selectBalanceType(optionId: "public" | "private") {
    await this.balanceTypeOption(optionId).click();
  }

  @step("Type address in search input: $0")
  async typeAddress(address: string) {
    await this.recipientInput.fill(address);
  }

  @step("Send to the matched recipient")
  async clickRecipientCardSend() {
    const button = this.dialog.getByTestId("send-recipient-card-send");
    await expect(button).toBeEnabled();
    await button.click();
  }

  @step("Select address from list")
  async clickOnSendToButton(account?: AccountType) {
    const label =
      account?.ensName ??
      (account?.address ? formatAddress(account.address, SEND_ADDRESS_FORMAT_OPTIONS) : undefined);

    const button = label
      ? this.matchedAddressButtons.filter({ hasText: label }).first()
      : this.matchedAddressButtons.first();

    await button.click();
  }

  @step("Clear the recipient input")
  async clearRecipient() {
    await this.recipientInput.fill("");
    await expect(this.recipientCard).toBeHidden();
  }

  @step("Select contact $0 from the address book")
  async selectContact(contactId: string) {
    await this.contactRow(contactId).click();
  }

  @step("Select contact address $0")
  async selectContactAddress(addressId: string) {
    await this.contactAddressRow(addressId).click();
  }

  @step("Verify the matched recipient is contact: $0")
  async expectMatchedContact(contactName: string) {
    await expect(this.recipientCard).toContainText(contactName);
    await expect(this.recipientCard.getByTestId("send-recipient-card-avatar")).toBeVisible();
  }

  @step("Verify the Add contact action is enabled")
  async expectAddContactEnabled() {
    await expect(this.recipientCardAddContactButton).toBeVisible();
    await expect(this.recipientCardAddContactButton).toBeEnabled();
  }

  @step("Verify the amount step recipient is contact: $0")
  async expectAmountStepContact(contactName: string) {
    await expect(this.recipientContactAvatar).toBeVisible();
    await expect(this.recipientDisplay).toHaveValue(contactName);
  }

  @step("Verify that recipient $0 is accepted")
  async expectAddressMatched(address: string) {
    // A local match can render the row while the bridge is still in flight, and a bridge
    // error keeps that row but blocks the click. Wait until validation settles first.
    await expect(this.recipientStep).toHaveAttribute("data-recipient-validation", "settled");
    await expect(this.recipientErrorBanner).toBeHidden();
    const label = formatAddress(address, SEND_ADDRESS_FORMAT_OPTIONS);
    const row = this.matchedAddressButtons.filter({ hasText: label });
    await expect(row).toHaveCount(1);
    // A bridge error still renders the row, with the click removed and this class applied.
    await expect(row).not.toHaveClass(/cursor-not-allowed/);
  }

  @step("Verify recipient validation error: $0")
  async expectRecipientError(message: string | RegExp) {
    await expect(this.recipientErrorBanner).toContainText(message);
  }

  @step("Verify recipient validation warning: $0")
  async expectRecipientWarning(message: string | RegExp) {
    await expect(this.recipientWarningBanner).toContainText(message);
  }

  @step("Verify recipient validation warning is hidden")
  async expectRecipientWarningHidden() {
    // The matched row can render from a local match while the bridge is still in flight.
    // The warning banner is mounted only once that request settles.
    await expect(this.recipientStep).toHaveAttribute("data-recipient-validation", "settled");
    await expect(this.recipientWarningBanner).toBeHidden();
  }

  @step("Verify invalid address feedback")
  async expectInvalidAddress() {
    await expect(this.validationStatusMessage).toBeVisible();
    await expect(this.matchedAddressButtons).toHaveCount(0);
  }

  @step("Verify that no recipient is accepted")
  async expectNoAddressMatched() {
    await expect(this.matchedAddressButtons).toHaveCount(0);
  }

  @step("Type memo: $0")
  async typeMemo(memo: string) {
    await this.memoInput.waitFor({ state: "visible" });
    await this.memoInput.fill(memo);
    await expect(this.memoInput).toHaveValue(memo);
  }

  @step("Verify the memo field is empty")
  async expectMemoEmpty() {
    await expect(this.memoInput).toBeVisible();
    await expect(this.memoInput).toHaveValue("");
  }

  @step("Confirm sending without memo")
  async confirmSkipMemo() {
    await this.skipMemoConfirmButton.click();
  }

  @step("Refuse to send without memo")
  async cancelSkipMemo() {
    await this.skipMemoCancelButton.click();
  }

  @step("Verify the recipient step is shown again with the memo input")
  async expectBackOnRecipientStepWithMemo() {
    await expect(this.skipMemoConfirmButton).toBeHidden();
    await expect(this.memoInput).toBeVisible();
    await expect(this.amountInput).toBeHidden();
  }

  @step("Open the memo type selector")
  async openMemoTypes() {
    await this.memoTypeSelect.click();
  }

  @step("Verify the memo type selector lists $0")
  async expectMemoTypeOptions(memoTypes: StellarMemoType[]) {
    for (const memoType of memoTypes) {
      await expect(this.memoTypeOption(memoType)).toBeVisible();
    }
  }

  @step("Select memo type $0")
  async selectMemoType(memoType: StellarMemoType) {
    await this.memoTypeOption(memoType).click();
  }

  @step("Verify the selected memo type is $0")
  async expectMemoType(memoType: StellarMemoType) {
    await expect(this.memoTypeSelect).toHaveText(STELLAR_MEMO_TYPE_LABELS[memoType]);
  }

  @step("Verify the recent history warning is shown")
  async expectRecentHistoryWarning() {
    await expect(this.recipientStep).toHaveAttribute("data-recipient-validation", "settled");
    await expect(this.recentHistoryWarning).toBeVisible();
  }

  @step("Click View details")
  async clickViewDetails() {
    await this.viewDetailsButton.click();
  }

  @step("Fill crypto amount: $0 (switches to crypto mode first)")
  async fillCryptoAmount(amount: string) {
    await expect.poll(() => this.isCryptoInputMode()).not.toBeNull();
    const isCryptoMode = await this.isCryptoInputMode();
    if (!isCryptoMode) {
      await this.toggleInputModeButton.click();
      await expect.poll(() => this.isCryptoInputMode()).toBe(true);
    }
    await this.amountInput.fill(amount);
  }

  @step("Verify the amount step is shown")
  async expectAmountStepVisible() {
    await expect(this.amountInput).toBeVisible();
  }

  @step("Verify crypto amount round-trips exactly: $0")
  async expectCryptoAmount(amount: string) {
    await expect(this.amountInput).toHaveValue(amount);
  }

  @step("Verify the amount input pins the currency magnitude at $0")
  async expectAmountMagnitude(amount: string) {
    // The exact-value check alone cannot detect a magnitude that is too *large*: an amount
    // filling N decimals round-trips at any magnitude >= N, so 0.123456789 survives at 9, 10
    // or 18 alike — and 18 is what a copy-paste from another ERC-20 would introduce. Probing
    // one decimal deeper closes that side: it must not survive at the intended magnitude.
    await this.fillCryptoAmount(`${amount}1`);
    await expect(this.amountInput).not.toHaveValue(`${amount}1`);
    await this.fillCryptoAmount(amount);
    await this.expectCryptoAmount(amount);
  }

  @step("Select maximum amount")
  async selectMaxAmount() {
    await this.quickActionMax.click();
  }

  @step("Verify review button is disabled")
  async expectReviewDisabled() {
    await expect(this.reviewButton).toBeDisabled();
  }

  // An insufficient funds error swaps the review CTA for an enabled "Get <ticker>" button.
  @step("Verify the get funds CTA replaced the review button")
  async expectGetFundsCta() {
    await expect(this.getFundsButton).toBeVisible();
    await expect(this.getFundsButton).toBeEnabled();
    await expect(this.reviewButton).toHaveCount(0);
  }

  @step("Verify review button is enabled")
  async expectReviewEnabled() {
    await expect(this.reviewButton).toBeEnabled();
  }

  @step("Verify amount error: $0")
  async expectAmountError(message: string | RegExp) {
    await expect(this.amountErrorMessage).toContainText(message);
  }

  @step("Click review to proceed to signature")
  async clickReview() {
    await expect(this.reviewButton).toBeEnabled();
    // A loading Review is still enabled; a sponsored send needs its quote first.
    await expect(this.reviewButton).not.toHaveAttribute("aria-busy", "true");
    await this.reviewButton.click();
  }

  @step("Open fees menu")
  async openFeesMenu() {
    await this.feesMenuTrigger.click();
  }

  @step("Select fee preset: $0")
  async selectFeePreset(preset: Fee) {
    await this.openFeesMenu();

    const item = this.getFeePreset(preset);
    await item.click();
    await item.waitFor({ state: "hidden" });
  }

  @step("Go back to the previous step")
  async goBack() {
    await this.backButton.click();
  }

  @step("Verify the sponsored fee offer is shown")
  async expectSponsoredNudgeVisible() {
    await expect(this.sponsoredFeeNudge).toBeVisible();
  }

  @step("Open the fee payment options")
  async openFeePayment() {
    await this.feePaymentEntry.click();
  }

  @step("Verify fee payment option $0 costs $1")
  async expectFeePaymentOptionFee(optionId: string, fee: string) {
    await expect(this.feePaymentOptionFee(optionId)).toContainText(fee);
  }

  @step("Select fee payment option: $0")
  async selectFeePaymentOption(optionId: string) {
    const option = this.feePaymentOption(optionId);
    await option.click();
    await expect(option).toHaveAttribute("aria-pressed", "true");
  }

  @step("Confirm the fee payment option")
  async confirmFeePayment() {
    await this.feePaymentConfirmButton.click();
    await expect(this.feePaymentConfirmButton).toBeHidden();
  }

  @step("Verify the network fee is paid with the sponsored option")
  async expectSponsoredFeeSelected() {
    await expect(this.sponsoredFeeValue).toBeVisible();
  }

  @step("Verify sponsored fee error: $0")
  async expectSponsoredFeeError(message: string | RegExp) {
    await expect(this.sponsoredFeeError).toContainText(message);
  }

  @step("Verify a paid rent is still arriving")
  async expectRentArriving() {
    await expect(this.sponsoredRentArriving).toBeVisible();
  }

  @step("Verify no rent is offered")
  async expectNoFeePaymentOffer() {
    await expect(this.feePaymentEntry).toBeHidden();
  }

  // NaN while the row shows no TRX amount yet (the `--` placeholder), which no comparison passes.
  private async networkFeeTrx(): Promise<number> {
    const match = /([\d.,]+)\s*TRX/.exec(await this.networkFeesRow.innerText());
    return match ? Number(match[1].replaceAll(",", "")) : Number.NaN;
  }

  @step("Read the network fee in TRX once it is estimated for the amount")
  async settledNetworkFeeTrx(): Promise<number> {
    await expect(this.reviewButton).toBeEnabled();
    await expect(this.reviewButton).not.toHaveAttribute("aria-busy", "true");
    await expect.poll(() => this.networkFeeTrx()).toBeGreaterThan(0);
    return this.networkFeeTrx();
  }

  @step("Verify the network fee dropped below $0 TRX once the rent landed")
  async expectFeeDroppedOnRentDelivery(feeBefore: number) {
    await expect(this.sponsoredRentArriving).toBeHidden();
    await expect.poll(() => this.networkFeeTrx()).toBeLessThan(feeBefore);
  }

  @step("Verify the energy delivery wait is shown")
  async waitForSponsoredPolling() {
    await expect(this.sponsoredPolling).toBeVisible();
  }

  @step("Verify the sponsored send failed: $0")
  async expectSponsoredFailure(message: string | RegExp) {
    await expect(this.sponsoredFailure).toContainText(message);
  }

  @step("Verify Retry is locked while the paid rent may still land")
  async expectRetryLocked() {
    await expect(this.sponsoredFailureRetry).toBeDisabled();
    await expect(this.sponsoredFailureRetryBlocked).toBeVisible();
  }

  @step("Verify Retry is offered as: $0")
  async expectRetryOffered(label: string | RegExp) {
    await expect(this.sponsoredFailureRetry).toBeEnabled();
    await expect(this.sponsoredFailureRetry).toHaveText(label);
  }

  @step("Verify no message says $0 is short")
  async expectNoFeeTokenShortfall(ticker: string) {
    await expect(this.notEnoughFeeTokenCopy(ticker)).toHaveCount(0);
  }

  @step("Cancel the failed sponsored send")
  async cancelSponsoredFailure() {
    await this.sponsoredFailureCancel.click();
    await expect(this.dialog).toBeHidden();
  }

  @step("Wait for signature screen or device action loader")
  async waitForSignature() {
    await this.deviceActionLoader.or(this.signaturePrompt).waitFor({ state: "visible" });
  }

  @step("Wait for terminal confirmation screen")
  async waitForConfirmation() {
    await this.confirmationTerminalContent.waitFor({ state: "visible" });
  }

  @step("Close the confirmation screen")
  async closeConfirmation() {
    await this.confirmationCloseButton.click();
    await expect(this.dialog).toBeHidden();
  }

  @step("Wait success confirmation screen")
  async waitForSuccessConfirmation() {
    await this.waitForConfirmation();
    // The flow is over once a terminal screen shows: fail now rather than wait out the timeout.
    const failureContent = this.confirmationErrorContent.or(this.confirmationInfoContent);
    if (await failureContent.isVisible()) {
      const details = await failureContent.locator("h3, p").allInnerTexts();
      throw new Error(`Send ended on a non-success screen: ${details.join(" — ")}`);
    }
    await expect(this.successConfirmationTitle).toBeVisible();
  }
}
