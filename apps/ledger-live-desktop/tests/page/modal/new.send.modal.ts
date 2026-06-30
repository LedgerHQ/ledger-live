import { expect } from "@playwright/test";
import { step } from "tests/misc/reporters/step";
import { Modal } from "../../component/modal.component";
import { looksLikeFiatValue } from "../../utils/looksLikeFiatValue";

export type StellarMemoType = "NO_MEMO" | "MEMO_TEXT" | "MEMO_ID" | "MEMO_HASH" | "MEMO_RETURN";

type FeePreset = "slow" | "medium" | "fast";

export class NewSendModal extends Modal {
  // ========== Dialog container ==========
  readonly dialog = this.page.getByRole("dialog");

  // ========== Header elements ==========
  readonly headerTitle = this.dialog.getByTestId("send-dialog-header");
  readonly backButton = this.headerTitle.getByRole("button", { name: "Go back" });
  override readonly closeButton = this.headerTitle.getByRole("button", { name: "Close" });

  readonly recipientInput = this.dialog.getByTestId("send-recipient-input");
  readonly editRecipientButton = this.dialog.getByTestId("send-edit-recipient-button");

  // ========== RECIPIENT STEP ==========
  readonly addressMatchedTitle = this.dialog.getByTestId("send-address-matched-title");
  readonly introCard = this.dialog.getByTestId("send-recipient-intro-card");
  readonly securityToggle = this.dialog.getByTestId("send-recipient-security-toggle");

  // Primary selectable button in "Address matched" section (ListItem is a button with "Send to X" text)
  readonly sendToButton = this.dialog.getByTestId("send-matched-address-button");
  readonly visibleSendToButton = this.dialog
    .locator('[data-testid="send-matched-address-button"]')
    .filter({ visible: true })
    .first();
  readonly addressNotFoundText = this.dialog.getByText(/address not found/i).first();
  readonly validationStatusMessage = this.dialog.getByTestId("address-validation-status");

  // Banners
  readonly sanctionedBanner = this.dialog.getByTestId("sanctioned-address-banner");
  readonly recipientErrorBanner = this.dialog.getByTestId("recipient-error-banner");
  readonly senderErrorBanner = this.dialog.getByTestId("sender-error-banner");
  readonly recentHistoryWarningCard = this.dialog.getByTestId("send-recent-history-warning");

  // Memo
  readonly memoInput = this.dialog.getByTestId("send-memo-input");
  readonly memoOptionsSelect = this.dialog.getByTestId("send-memo-options-select");
  // Select content is portalled outside the dialog subtree.
  readonly memoOptionNoMemo = this.page.getByTestId("send-memo-select-option-NO_MEMO");
  readonly memoOptionText = this.page.getByTestId("send-memo-select-option-MEMO_TEXT");
  readonly memoOptionId = this.page.getByTestId("send-memo-select-option-MEMO_ID");
  readonly memoOptionHash = this.page.getByTestId("send-memo-select-option-MEMO_HASH");
  readonly memoOptionReturn = this.page.getByTestId("send-memo-select-option-MEMO_RETURN");
  readonly skipMemoProposal = this.dialog.getByTestId("send-skip-memo-proposal");
  readonly skipMemoLink = this.dialog.getByTestId("send-skip-memo-link");
  readonly skipMemoConfirmButton = this.dialog.getByTestId("send-skip-memo-confirm-button");
  readonly neverAskAgainSkipMemoButton = this.dialog.getByTestId(
    "send-skip-memo-never-ask-again-button",
  );

  // ========== AMOUNT STEP ==========
  readonly amountInput = this.dialog.getByTestId("send-amount-input");
  readonly amountErrorMessage = this.dialog.getByTestId("send-amount-message");
  readonly quickAction25 = this.dialog.getByTestId("send-quick-actions-quarter");
  readonly quickAction50 = this.dialog.getByTestId("send-quick-actions-half");
  readonly quickAction75 = this.dialog.getByTestId("send-quick-actions-threeQuarters");
  readonly quickActionMax = this.dialog.getByTestId("send-quick-actions-max");
  readonly feesMenuTrigger = this.dialog.getByTestId("send-network-fees-menu-trigger");
  // Menu items are portalled outside the dialog subtree.
  readonly customFeesMenuItem = this.page.getByTestId("send-custom-fees-menu-item");
  readonly coinControlFeesMenuItem = this.page.getByTestId("send-coin-control-fees-menu-item");
  readonly reviewButton = this.dialog.getByTestId("send-review-button");
  readonly getFundsButton = this.dialog.getByTestId("send-get-funds-button");
  // Toggle button to switch between FIAT and CRYPTO input modes
  readonly toggleInputModeButton = this.dialog.getByTestId("send-toggle-input-mode-button");
  readonly amountSecondaryValue = this.dialog.getByTestId("send-amount-secondary-value");

  getFeePreset(preset: FeePreset) {
    return this.page.getByTestId(`send-fees-preset-${preset}`);
  }

  // ========== CUSTOM FEES STEP ==========
  readonly customFeesConfirmButton = this.dialog.getByRole("button", { name: /confirm/i });
  readonly customFeesFeePerByteInput = this.dialog.getByLabel(/fees amount.*sat\/vbyte/i);
  readonly customFeesMaxFeeInput = this.dialog.getByLabel(/max fee.*gwei/i);
  readonly customFeesMaxPriorityFeeInput = this.dialog.getByLabel(/max priority fee.*gwei/i);

  // ========== COIN CONTROL STEP ==========
  readonly coinControlFooter = this.dialog.getByTestId("send-coin-control-footer");
  readonly coinControlChangeToReturn = this.dialog.getByTestId("send-change-to-return-row");
  readonly coinControlAmountInput = this.dialog.getByLabel(/amount to send/i);

  // ========== CONFIRMATION STEP ==========
  readonly confirmationSuccessContent = this.dialog.getByTestId(
    "send-confirmation-success-content",
  );
  readonly confirmationErrorContent = this.dialog.getByTestId("send-confirmation-error-content");
  readonly confirmationInfoContent = this.dialog.getByTestId("send-confirmation-info-content");
  /**
   * Any terminal confirmation screen (success, error, or info).
   * Use `waitForSuccessConfirmation()` when asserting success specifically.
   */
  readonly confirmationTerminalContent = this.confirmationSuccessContent
    .or(this.confirmationErrorContent)
    .or(this.confirmationInfoContent);
  readonly successConfirmationTitle = this.dialog.getByTestId("send-confirmation-success-title");

  private async isCryptoInputMode(): Promise<boolean | null> {
    const secondaryValue = (await this.amountSecondaryValue.textContent())?.trim() ?? "";
    // Return null when the element isn't populated yet so callers can retry.
    if (!secondaryValue) return null;
    return looksLikeFiatValue(secondaryValue);
  }

  // ========== DIALOG LIFECYCLE ==========

  @step("Wait for send flow dialog to open")
  async waitForDialog() {
    await this.dialog.waitFor({ state: "visible", timeout: 15000 });
    // Wait for animations
    await this.page.waitForTimeout(500);
  }

  @step("Click back button")
  async goBack() {
    await this.backButton.waitFor({ state: "visible" });
    await this.backButton.click();
    await this.page.waitForTimeout(300);
  }

  // ========== RECIPIENT STEP METHODS ==========

  @step("Type address in search input: $0")
  async typeAddress(address: string) {
    await this.recipientInput.waitFor({ state: "visible" });
    await this.recipientInput.fill(address);
  }

  @step("Select address from list")
  async clickOnSendToButton() {
    await this.visibleSendToButton.waitFor({ state: "visible", timeout: 30000 });
    // Bridge async validation may cause re-renders; wait for DOM to stabilize
    await this.page.waitForTimeout(500);
    await this.visibleSendToButton.scrollIntoViewIfNeeded();
    await this.visibleSendToButton.click();
  }

  @step("Wait for address validation")
  async waitForRecipientValidation() {
    const timeoutMs = 20000;
    await expect
      .poll(
        async () => {
          if (await this.sendToButton.isVisible().catch(() => false)) return "sendToButton-visible";
          if (await this.addressNotFoundText.isVisible().catch(() => false))
            return "addressNotFound-visible";
          if (await this.validationStatusMessage.isVisible().catch(() => false))
            return "validationStatus-visible";
          if (await this.sanctionedBanner.isVisible().catch(() => false))
            return "sanctionedBanner-visible";
          if (await this.recipientErrorBanner.isVisible().catch(() => false))
            return "recipientErrorBanner-visible";
          if (await this.senderErrorBanner.isVisible().catch(() => false))
            return "senderErrorBanner-visible";
          if (await this.skipMemoProposal.isVisible().catch(() => false))
            return "skipMemoProposal-visible";
          return null;
        },
        {
          timeout: timeoutMs,
          message: `Recipient validation did not complete within ${timeoutMs}ms: none of the expected states (Send to button, address not found, validation status, sanctioned/recipient/sender error banners, skip memo proposal) became visible.`,
        },
      )
      .not.toBeNull();
  }

  @step("Verify sanctioned banner visible")
  async expectSanctionedBanner() {
    await expect(this.sanctionedBanner).toBeVisible({ timeout: 5000 });
  }

  @step("Verify address matched section visible")
  async expectAddressMatched() {
    await expect(this.addressMatchedTitle).toBeVisible({ timeout: 5000 });
  }

  @step("Click edit recipient from Amount header")
  async editRecipientFromAmountStep() {
    await this.editRecipientButton.waitFor({ state: "visible", timeout: 5000 });
    await this.editRecipientButton.click();
    await this.page.waitForTimeout(300);
  }

  @step("Skip memo")
  async skipMemo({ confirm = true }: { confirm?: boolean } = {}) {
    await this.skipMemoLink.click();
    if (confirm) {
      await this.confirmSkipMemo();
    }
  }

  @step("Confirm skip memo")
  async confirmSkipMemo() {
    await this.skipMemoConfirmButton.waitFor({ state: "visible" });
    await this.skipMemoConfirmButton.click();
  }

  @step("Check never ask again memo")
  async checkNeverAskAgainSkipMemo() {
    await this.neverAskAgainSkipMemoButton.waitFor({ state: "visible" });
    await this.neverAskAgainSkipMemoButton.click();
  }

  @step("Type memo")
  async typeMemo(memo: string) {
    await this.memoInput.waitFor({ state: "visible" });
    await this.memoInput.fill(memo);
  }

  @step("Select memo type $0")
  async selectMemoType(type: StellarMemoType) {
    switch (type) {
      case "NO_MEMO":
        await this.memoOptionNoMemo.waitFor({ state: "visible" });
        await this.memoOptionNoMemo.click();
        break;
      case "MEMO_TEXT":
        await this.memoOptionText.waitFor({ state: "visible" });
        await this.memoOptionText.click();
        break;
      case "MEMO_ID":
        await this.memoOptionId.waitFor({ state: "visible" });
        await this.memoOptionId.click();
        break;
      case "MEMO_HASH":
        await this.memoOptionHash.waitFor({ state: "visible" });
        await this.memoOptionHash.click();
        break;
      default:
        await this.memoOptionReturn.waitFor({ state: "visible" });
        await this.memoOptionReturn.click();
        break;
    }
  }

  // ========== AMOUNT STEP METHODS ==========

  @step("Switch to crypto input mode")
  async switchToCryptoMode() {
    // Poll until secondary value is populated (null = not ready yet)
    await expect.poll(() => this.isCryptoInputMode()).not.toBeNull();
    const isCryptoMode = await this.isCryptoInputMode();
    if (!isCryptoMode) {
      await this.toggleInputModeButton.click();
      // null won't match true, so the poll keeps retrying until the switch completes
      await expect.poll(() => this.isCryptoInputMode()).toBe(true);
    }
  }

  @step("Switch to fiat input mode")
  async switchToFiatMode() {
    // Poll until secondary value is populated (null = not ready yet)
    await expect.poll(() => this.isCryptoInputMode()).not.toBeNull();
    const isCryptoMode = await this.isCryptoInputMode();
    if (isCryptoMode) {
      await this.toggleInputModeButton.click();
      // null won't match false, so the poll keeps retrying until the switch completes
      await expect.poll(() => this.isCryptoInputMode()).toBe(false);
    }
  }

  @step("Wait for review button to be enabled")
  async waitForReviewButtonEnabled(timeout: number = 30000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const isEnabled = await this.reviewButton.isEnabled().catch(() => false);
      if (isEnabled) {
        return true;
      }
      await this.page.waitForTimeout(250);
    }
    return false;
  }

  @step("Fill amount: $0")
  async fillAmount(amount: string) {
    await this.amountInput.waitFor({ state: "visible", timeout: 10000 });
    await this.switchToFiatMode();
    await this.amountInput.fill(amount);
    await this.page.waitForTimeout(800); // Wait for validation
  }

  @step("Fill crypto amount: $0 (switches to crypto mode first)")
  async fillCryptoAmount(amount: string) {
    await this.amountInput.waitFor({ state: "visible", timeout: 10000 });

    await this.switchToCryptoMode();
    await this.amountInput.fill(amount);
  }

  @step("Click quick action: $0")
  async clickQuickAction(action: "25%" | "50%" | "75%" | "Max") {
    let button;
    switch (action) {
      case "25%":
        button = this.quickAction25;
        break;
      case "50%":
        button = this.quickAction50;
        break;
      case "75%":
        button = this.quickAction75;
        break;
      case "Max":
        button = this.quickActionMax;
        break;
    }
    await button.waitFor({ state: "visible", timeout: 5000 });
    await button.click();
    await this.page.waitForTimeout(500);
  }

  @step("Click review to proceed to signature")
  async clickReview() {
    await this.reviewButton.waitFor({ state: "visible", timeout: 10000 });
    // Wait for button to be enabled (no errors, has amount, not bridgePending)
    const isEnabled = await this.waitForReviewButtonEnabled(30000);
    if (!isEnabled) {
      throw new Error("Review button did not become enabled within timeout");
    }
    await this.reviewButton.click();
    await this.page.waitForTimeout(500);
  }

  @step("Verify review button is disabled")
  async expectReviewDisabled() {
    await expect(this.reviewButton).toBeDisabled({ timeout: 10000 });
  }

  @step("Verify review button is enabled")
  async expectReviewEnabled(timeout: number = 30000) {
    // Use polling to wait for the button to become enabled
    // This handles the case where bridgePending is true during transaction preparation
    const isEnabled = await this.waitForReviewButtonEnabled(timeout);
    if (!isEnabled) {
      // Fall back to the standard assertion for better error messages
      await expect(this.reviewButton).toBeEnabled({ timeout: 5000 });
    }
  }

  @step("Verify amount error message visible")
  async expectAmountError() {
    await expect(this.amountErrorMessage).toBeVisible({ timeout: 5000 });
  }

  @step("Verify Get Funds button visible")
  async expectGetFundsButton() {
    await expect(this.getFundsButton).toBeVisible({ timeout: 5000 });
  }

  @step("Open fees menu")
  async openFeesMenu() {
    await this.feesMenuTrigger.waitFor({ state: "visible" });
    await this.feesMenuTrigger.click();
  }

  @step("Select fee preset: $0")
  async selectFeePreset(preset: FeePreset) {
    await this.openFeesMenu();

    const item = this.getFeePreset(preset);
    await item.waitFor({ state: "visible", timeout: 10000 });
    await item.click();

    await this.page.waitForTimeout(300);
  }

  // ========== CUSTOM FEES STEP METHODS ==========

  @step("Open custom fees screen")
  async openCustomFees() {
    await this.openFeesMenu();
    await this.customFeesMenuItem.waitFor({ state: "visible" });
    await this.customFeesMenuItem.click();
    await this.page.waitForTimeout(500);
  }

  @step("Open coin control screen")
  async openCoinControl() {
    await this.openFeesMenu();
    await this.coinControlFeesMenuItem.waitFor({ state: "visible" });
    await this.coinControlFeesMenuItem.click();
    await this.page.waitForTimeout(500);
  }

  @step("Confirm custom fees")
  async confirmCustomFees() {
    await this.customFeesConfirmButton.waitFor({ state: "visible" });
    await this.customFeesConfirmButton.click();
    await this.page.waitForTimeout(500);
  }

  // ========== SIGNATURE STEP METHODS ==========

  // The device loader is rendered globally, outside the dialog subtree.
  readonly deviceActionLoader = this.page.getByTestId("device-action-loader");
  readonly signaturePrompt = this.dialog.getByTestId("send-signature-prompt");

  @step("Wait for signature screen or device action loader")
  async waitForSignature() {
    await this.deviceActionLoader.or(this.signaturePrompt).waitFor({ state: "visible" });
  }

  // ========== CONFIRMATION STEP METHODS ==========

  @step("Wait for terminal confirmation screen")
  async waitForConfirmation() {
    await this.confirmationTerminalContent.waitFor({ state: "visible" });
  }

  @step("Wait success confirmation screen")
  async waitForSuccessConfirmation() {
    await this.waitForConfirmation();
    await expect(this.successConfirmationTitle).toBeVisible();
  }

  // ========== UTILITY METHODS ==========

  @step("Verify dialog is visible")
  async expectDialogVisible() {
    await expect(this.dialog).toBeVisible({ timeout: 10000 });
  }

  @step("Verify header title contains: $0")
  async expectHeaderTitle(text: string) {
    await expect(this.headerTitle).toContainText(text, { timeout: 5000 });
  }

  async getAmountValue(): Promise<string> {
    // Lumen's AmountInput formats the value with locale thousands separators
    // (e.g. "12 831.23"); strip whitespace so the raw numeric string is returned.
    return ((await this.amountInput.inputValue()) || "").replace(/\s/g, "");
  }

  @step("Going to the amount step")
  async reachAmountStep(address: string, hasMemo: boolean = false) {
    await this.typeAddress(address);
    await this.waitForRecipientValidation();
    if (hasMemo) {
      await this.skipMemo();
    } else {
      await this.clickOnSendToButton();
    }
    await expect(this.amountInput).toBeVisible({ timeout: 10000 });
  }

  @step("Going to the signature step")
  async reachSignatureStep(address: string) {
    await this.typeAddress(address);
    await this.waitForRecipientValidation();
    await this.clickOnSendToButton();
    await expect(this.amountInput).toBeVisible({ timeout: 10000 });
    await this.fillCryptoAmount("0.001");
    await this.clickReview();
    await this.waitForSignature();
  }
}
