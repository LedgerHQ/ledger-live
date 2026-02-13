import { expect } from "@playwright/test";
import { FeePreset } from "tests/common/newSendFlow/types";
import { step } from "tests/misc/reporters/step";
import { Component } from "tests/page/abstractClasses";

export type StellarMemoType = "NO_MEMO" | "MEMO_TEXT" | "MEMO_ID" | "MEMO_HASH" | "MEMO_RETURN";

export class NewSendFlowPage extends Component {
  // ========== Dialog container ==========
  readonly dialog = this.page.getByRole("dialog");

  // ========== Header elements ==========
  readonly headerTitle = this.dialog.getByTestId("send-dialog-header");
  readonly backButton = this.headerTitle.getByRole("button", { name: "Go back" });
  readonly closeButton = this.headerTitle.getByRole("button", { name: "Close" });

  readonly recipientInput = this.dialog.getByTestId("send-recipient-input");
  readonly editRecipientButton = this.dialog.getByTestId("send-edit-recipient-button");

  // ========== RECIPIENT STEP ==========
  readonly myAccountsSection = this.dialog.getByTestId("send-my-accounts-section");
  readonly addressMatchedTitle = this.dialog.getByTestId("send-address-matched-title");
  // Recent addresses are rendered as tiles with a "More actions" secondary button.
  readonly recentTileMoreActionsButtons = this.dialog.getByTestId("send-recent-tile-action");

  // Primary selectable button in "Address matched" section (ListItem is a button with "Send to X" text)
  readonly sendToButton = this.dialog.getByTestId("send-matched-address-button");
  readonly addressNotFoundText = this.dialog.getByText(/address not found/i).first();
  readonly validationStatusMessage = this.dialog.getByTestId("address-validation-status");

  // Banners
  readonly sanctionedBanner = this.dialog.getByTestId("sanctioned-address-banner");
  readonly recipientErrorBanner = this.dialog.getByTestId("recipient-error-banner");
  readonly senderErrorBanner = this.dialog.getByTestId("sender-error-banner");
  readonly newAddressBanner = this.dialog.getByText(/sending to a new address/i).first();

  // Memo
  readonly memoInput = this.dialog.getByTestId("send-memo-input");
  readonly memoOptionsSelect = this.dialog.getByTestId("send-memo-options-select");
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
  readonly customFeesMenuItem = this.page.getByTestId("send-custom-fees-menu-item");
  readonly coinControlFeesMenuItem = this.page.getByTestId("send-coin-control-fees-menu-item");
  readonly reviewButton = this.dialog.getByTestId("send-review-button");
  readonly getFundsButton = this.dialog.getByTestId("send-get-funds-button");
  // Toggle button to switch between FIAT and CRYPTO input modes
  readonly toggleInputModeButton = this.dialog.getByTestId("send-toggle-input-mode-button");

  // ========== CONFIRMATION STEP ==========
  readonly confirmationStatusContent = this.dialog.locator(
    '[data-testid="send-confirmation-success-content"], [data-testid="send-confirmation-error-content"], [data-testid="send-confirmation-info-content"]',
  );

  // ========== DIALOG LIFECYCLE ==========

  @step("Wait for send flow dialog to open")
  async waitForDialog() {
    await this.dialog.waitFor({ state: "visible", timeout: 15000 });
    // Wait for animations
    await this.page.waitForTimeout(500);
  }

  @step("Close dialog")
  async close() {
    await this.closeButton.click();
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
    await this.recipientInput.clear();
    await this.recipientInput.fill(address);
  }

  @step("Select address from list (index: $0)")
  async clickOnSendToButton() {
    const visibleSendToButton = this.dialog
      .locator('[data-testid="send-matched-address-button"]:visible')
      .first();
    await visibleSendToButton.waitFor({ state: "visible", timeout: 30000 });
    // Bridge async validation may cause re-renders; wait for DOM to stabilize
    await this.page.waitForTimeout(500);
    await visibleSendToButton.scrollIntoViewIfNeeded();
    await visibleSendToButton.click();
  }

  @step("Remove recent address tile (index: $0)")
  async removeRecentAddressTile(index: number = 0) {
    const moreActions = this.recentTileMoreActionsButtons.nth(index);
    await moreActions.waitFor({ state: "visible", timeout: 10000 });
    await moreActions.click();

    const removeItem = this.page.getByRole("menuitem", { name: /remove/i });
    await removeItem.waitFor({ state: "visible", timeout: 10000 });
    await removeItem.dispatchEvent("click");

    // Menu closes asynchronously.
    await this.page.waitForTimeout(300);
  }

  @step("Wait for address validation")
  async waitForRecipientValidation() {
    const timeoutMs = 20000;
    const waiters = [
      this.sendToButton.waitFor({ state: "visible", timeout: timeoutMs }),
      this.addressNotFoundText.waitFor({ state: "visible", timeout: timeoutMs }),
      this.validationStatusMessage.waitFor({ state: "visible", timeout: timeoutMs }),
      this.sanctionedBanner.waitFor({ state: "visible", timeout: timeoutMs }),
      this.recipientErrorBanner.waitFor({ state: "visible", timeout: timeoutMs }),
      this.senderErrorBanner.waitFor({ state: "visible", timeout: timeoutMs }),
      this.skipMemoProposal.waitFor({ state: "visible", timeout: timeoutMs }),
    ];
    try {
      await Promise.any(waiters);
    } catch {
      throw new Error(
        `Recipient validation did not complete within ${timeoutMs}ms: none of the expected states (Send to button, address not found, validation status, sanctioned/recipient/sender error banners, skip memo proposal) became visible.`,
      );
    }
    await this.page.waitForTimeout(250);
  }

  @step("Verify sanctioned banner visible")
  async expectSanctionedBanner() {
    await expect(this.sanctionedBanner).toBeVisible({ timeout: 5000 });
  }

  @step("Verify recipient error banner visible")
  async expectRecipientError() {
    await expect(this.recipientErrorBanner).toBeVisible({ timeout: 5000 });
  }

  @step("Verify sender error banner visible")
  async expectSenderError() {
    await expect(this.senderErrorBanner).toBeVisible({ timeout: 5000 });
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

  @step("Verify validation message contains: $0")
  async expectValidationMessage(text: RegExp | string) {
    const hasValidationMessage = await this.validationStatusMessage.isVisible().catch(() => false);
    if (hasValidationMessage) {
      await expect(this.validationStatusMessage).toContainText(text, { timeout: 10000 });
      return;
    }

    const hasAddressNotFound = await this.addressNotFoundText.isVisible().catch(() => false);
    if (hasAddressNotFound) {
      await expect(this.addressNotFoundText).toBeVisible({ timeout: 5000 });
      return;
    }

    const hasRecipientBanner = await this.recipientErrorBanner.isVisible().catch(() => false);
    if (hasRecipientBanner) {
      await expect(this.recipientErrorBanner).toBeVisible({ timeout: 5000 });
      return;
    }

    throw new Error("No validation message or error banner appeared");
  }

  @step("Skip memo")
  async skipMemo(confirm: boolean = true) {
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
    // By default, the amount input is in FIAT mode. Click toggle to switch to CRYPTO.
    const toggleButton = this.toggleInputModeButton;
    const isVisible = await toggleButton.isVisible().catch(() => false);
    if (isVisible) {
      await toggleButton.click();
      await this.page.waitForTimeout(300);
    }
  }

  @step("Wait for bridge to be ready (not loading)")
  async waitForBridgeReady(timeout: number = 30000) {
    // Wait for the review button to stop showing loading state
    // The button has loading={reviewLoading} which is true when bridgePending && shouldPrepare
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const isLoading = await this.reviewButton.getAttribute("data-loading").catch(() => null);
      const isDisabled = await this.reviewButton.isDisabled().catch(() => true);

      // If button is visible and not in a loading state, bridge is ready
      if (isLoading !== "true" && !isDisabled) {
        return;
      }

      // Also check if button becomes enabled
      const isEnabled = await this.reviewButton.isEnabled().catch(() => false);
      if (isEnabled) {
        return;
      }

      await this.page.waitForTimeout(250);
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
    await this.amountInput.clear();
    await this.amountInput.fill(amount);
    await this.page.waitForTimeout(800); // Wait for validation
  }

  @step("Fill crypto amount: $0 (switches to crypto mode first)")
  async fillCryptoAmount(amount: string) {
    await this.amountInput.waitFor({ state: "visible", timeout: 10000 });

    await this.switchToCryptoMode();
    await this.amountInput.clear();
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

  @step("Click review to proceed to signature")
  async clickReview2() {
    await this.reviewButton.waitFor({ state: "visible" });
    await this.reviewButton.click();
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

  @step("Click Get Funds button")
  async clickGetFunds() {
    await this.getFundsButton.waitFor({ state: "visible", timeout: 5000 });
    await this.getFundsButton.click();
  }

  @step("Open fees menu")
  async openFeesMenu() {
    await this.feesMenuTrigger.waitFor({ state: "visible" });
    await this.feesMenuTrigger.click();
  }

  @step("Select fee preset: $0")
  async selectFeePreset(preset: FeePreset) {
    await this.openFeesMenu();

    const item = this.page.getByTestId(`send-fees-preset-${preset}`);
    await item.waitFor({ state: "visible", timeout: 10000 });
    await item.click();

    await this.page.waitForTimeout(300);
  }

  async getFeePreset(preset: FeePreset) {
    return this.page.getByTestId(`send-fees-preset-${preset}`);
  }

  // ========== SIGNATURE STEP METHODS ==========

  readonly deviceActionLoader = this.page.getByTestId("device-action-loader");

  @step("Wait for signature screen and device action loader")
  async waitForSignature() {
    // Wait for device action loader to appear - this means we're in signature step
    await this.deviceActionLoader.waitFor({ state: "visible" });
  }

  // ========== CONFIRMATION STEP METHODS ==========

  @step("Wait for confirmation screen")
  async waitForConfirmation() {
    await this.confirmationStatusContent.waitFor({ state: "visible" });
  }

  @step("Wait for signature or confirmation step")
  async waitForSignatureOrConfirmation() {
    const timeout = 20000;
    const start = Date.now();

    while (Date.now() - start < timeout) {
      const isSignatureLoaderVisible = await this.deviceActionLoader.isVisible().catch(() => false);
      if (isSignatureLoaderVisible) {
        return;
      }

      const isConfirmationVisible = await this.confirmationStatusContent
        .isVisible()
        .catch(() => false);
      if (isConfirmationVisible) {
        return;
      }

      await this.page.waitForTimeout(250);
    }

    throw new Error("Timed out waiting for signature or confirmation step");
  }

  @step("Verify success confirmation")
  async expectSuccess() {
    await expect(this.dialog.getByTestId("send-confirmation-success-title")).toBeVisible({
      timeout: 10000,
    });
  }

  @step("Verify error confirmation")
  async expectError() {
    await expect(this.dialog.getByTestId("send-confirmation-error-title")).toBeVisible({
      timeout: 10000,
    });
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
    return (await this.amountInput.inputValue()) || "";
  }

  async getAddressValue(): Promise<string> {
    return (await this.recipientInput.inputValue()) || "";
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
