import { expect } from "@playwright/test";
import { Fee } from "@ledgerhq/live-common/e2e/enum/Fee";
import { step } from "tests/misc/reporters/step";
import { Modal } from "tests/component/modal.component";
import { looksLikeFiatValue } from "tests/utils/looksLikeFiatValue";

export class NewSendModal extends Modal {
  readonly dialog = this.page.getByRole("dialog");

  readonly recipientInput = this.dialog.getByTestId("send-recipient-input");
  readonly visibleSendToButton = this.dialog
    .locator('[data-testid="send-matched-address-button"]')
    .filter({ visible: true })
    .first();
  readonly memoInput = this.dialog.getByTestId("send-memo-input");
  readonly skipMemoLink = this.dialog.getByTestId("send-skip-memo-link");
  readonly skipMemoConfirmButton = this.dialog.getByTestId("send-skip-memo-confirm-button");
  readonly amountInput = this.dialog.getByTestId("send-amount-input");
  readonly feesMenuTrigger = this.dialog.getByTestId("send-network-fees-menu-trigger");
  readonly reviewButton = this.dialog.getByTestId("send-review-button");
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
  readonly deviceActionLoader = this.page.getByTestId("device-action-loader");
  readonly signaturePrompt = this.dialog.getByTestId("send-signature-prompt");

  getFeePreset(preset: Fee) {
    return this.page.getByTestId(`send-fees-preset-${preset.toLowerCase()}`);
  }

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

  @step("Type address in search input: $0")
  async typeAddress(address: string) {
    await this.recipientInput.fill(address);
  }

  @step("Select address from list")
  async clickOnSendToButton() {
    await this.visibleSendToButton.scrollIntoViewIfNeeded();
    await this.visibleSendToButton.click();
  }

  @step("Skip memo")
  async skipMemo({ confirm = true }: { confirm?: boolean } = {}) {
    await this.skipMemoLink.click();
    if (confirm) {
      await this.skipMemoConfirmButton.click();
    }
  }

  @step("Type memo")
  async typeMemo(memo: string) {
    await this.memoInput.fill(memo);
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

  @step("Click review to proceed to signature")
  async clickReview() {
    await expect(this.reviewButton).toBeEnabled();
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

  @step("Wait for signature screen or device action loader")
  async waitForSignature() {
    await this.deviceActionLoader.or(this.signaturePrompt).waitFor({ state: "visible" });
  }

  @step("Wait for terminal confirmation screen")
  async waitForConfirmation() {
    await this.confirmationTerminalContent.waitFor({ state: "visible" });
  }

  @step("Wait success confirmation screen")
  async waitForSuccessConfirmation() {
    await this.waitForConfirmation();
    await expect(this.successConfirmationTitle).toBeVisible();
  }
}
