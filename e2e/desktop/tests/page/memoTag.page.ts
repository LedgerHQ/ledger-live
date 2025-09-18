import { expect } from "@playwright/test";
import { PageHolder } from "./abstractClasses";
import { step } from "../misc/reporters/step";

export class MemoTagPage extends PageHolder {
  private learnMoreLink = this.page.getByTestId("modal-content").locator("a");
  private continueButton = this.page.getByRole("button", { name: "Continue" });
  private amountInput = this.page.getByTestId("modal-amount-field");
  private memoTagSummary = this.page.getByTestId("modal-content");
  private dontShowAgainCheckbox = this.page.getByTestId("memo-tag-show-again-checkbox");
  private dontShowAgainChecked = this.page.getByTestId("check-icon");
  private warningMemoTagByText = this.page.getByText("Need Tag/Memo?");
  private addTagButtonById = this.page.getByTestId("memo-tag-add-button");
  private dontAddTagButtonById = this.page.getByTestId("memo-tag-dont-add-button");
  private tagInput = this.page.getByTestId("memo-tag-input");

  @step("Verify learn more link is visible")
  async expectLearnMoreLinkVisible() {
    await expect(this.learnMoreLink).toBeVisible();
  }

  @step("Verify warning memo tag is visible")
  async expectWarningMemoTagVisible() {
    await expect(this.warningMemoTagByText).toBeVisible();
  }

  @step("Verify continue button is visible")
  async expectContinueButtonVisible() {
    await expect(this.continueButton).toBeVisible();
  }

  @step("Verify continue button is enabled")
  async expectContinueButtonEnabled() {
    await expect(this.continueButton).toBeEnabled();
  }

  @step("Click continue button")
  async clickContinueButton() {
    await this.continueButton.click();
  }

  @step("Verify memo tag field is visible")
  async expectMemoTagFilledVisible() {
    await expect(this.memoTagSummary).toBeVisible();
  }
  @step("Verify memo tag field is not visible")
  async expectMemoTagFilledNotVisible() {
    await expect(this.memoTagSummary).not.toBeVisible();
  }

  @step("Verify memo tag contains the right value")
  async expectMemoTagContainsRightValue(value: string) {
    await expect(this.memoTagSummary).toContainText(value);
  }

  @step("Verify memo tag contains the right value")
  async expectSummaryNotContainMemoTag(value: string) {
    await expect(this.memoTagSummary).not.toContainText(value);
  }

  @step("Verify checkbox is visible")
  async expectCheckboxVisible() {
    await expect(this.dontShowAgainCheckbox).toBeVisible();
  }

  @step("Verify checkbox is unchecked")
  async expectCheckboxUnchecked() {
    await expect(this.dontShowAgainCheckbox).toBeEmpty();
  }

  @step("Tick checkbox")
  async tickCheckbox() {
    await this.dontShowAgainCheckbox.click();
  }

  @step("Verify checkbox is checked")
  async expectCheckboxChecked() {
    await expect(this.dontShowAgainChecked).toBeVisible();
  }

  @step("Verify 'Don't add Tag' button is visible")
  async expectDontAddTagButtonVisible() {
    await expect(this.addTagButtonById).toBeVisible();
  }

  @step("Click 'Don't add Tag' button")
  async clickDontAddTag() {
    await this.dontAddTagButtonById.click();
  }

  @step("Verify 'Add Tag' button is visible")
  async expectAddTagButtonVisible() {
    await expect(this.addTagButtonById).toBeVisible();
  }

  @step("Click 'Add Tag' button")
  async clickAddTag() {
    await this.addTagButtonById.click();
  }

  @step("Verify tag input is visible")
  async expectTagInputVisible() {
    await expect(this.tagInput).toBeVisible();
  }

  @step("Fill tag input")
  async fillTagInput(tag: string) {
    await this.tagInput.fill(tag);
  }

  @step("Verify memo tag input not visible")
  async expectMemoTagInputNotVisible() {
    await expect(this.tagInput).not.toBeVisible();
  }

  @step("Verify amount input is visible")
  async expectAmountInputVisible() {
    await expect(this.amountInput).toBeVisible();
  }
  @step("Fill amount input")
  async fillAmountInput(amount: string) {
    await this.amountInput.fill(amount);
  }
}
