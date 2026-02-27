import { expect } from "@playwright/test";
import { PageHolder } from "./abstractClasses";
import { step } from "../misc/reporters/step";

export class MemoTagPage extends PageHolder {
  private learnMoreLink = this.page.getByTestId("modal-content").locator("a");
  private continueButton = this.page.getByRole("button", { name: "Continue" });
  private reviewButton = this.page.getByTestId("send-review-button");
  private amountInputMvvm = this.page.getByTestId("send-amount-input");
  private amountInputLegacy = this.page.getByTestId("modal-amount-field");
  private memoTagSummaryLegacy = this.page.getByTestId("modal-content");
  private memoTagSummaryMvvm = this.page.getByTestId("send-signature-step");
  private dontShowAgainCheckbox = this.page.getByTestId("check-icon");
  private warningMemoTagByText = this.page.getByText("Need Tag/Memo?");
  private addTagButtonById = this.page.getByRole("button", { name: "Add Tag", exact: true });
  private dontAddTagButtonById = this.page.getByRole("button", { name: "Don’t add Tag" });
  private tagInput = this.page.getByTestId("memo-tag-input");
  private continueOrReview = this.continueButton.or(this.reviewButton);
  private amountInput = this.amountInputMvvm.or(this.amountInputLegacy);
  private matchedAddressBtn = this.page.getByTestId("send-matched-address-button");
  private continueBtn = this.page.getByRole("button", { name: /continue/i });
  private dontAddTagBtn = this.page.getByTestId("memo-tag-dont-add-button");
  private addressSection = this.page.getByTestId("send-address-matched-title").locator("..");
  private addressFirstItem = this.addressSection
    .locator("[data-testid='send-matched-address-button'], [role=listitem], li")
    .first();
  private stellarMemoOrSelect = this.page
    .getByTestId("stellar-memo-type-container")
    .or(this.page.getByText("Memo", { exact: true }))
    .or(this.page.getByText("No Memo"));
  private stellarMemoVisible = this.stellarMemoOrSelect.first();
  private stellarMemoNewFlowTrigger = this.page.getByTestId("stellar-memo-dropdown-trigger");
  private legacyMemoSelect = this.page.getByTestId("stellar-memo-type-select");
  private legacyMemoTrigger = this.legacyMemoSelect.locator(".select__control");
  private allSelectControls = this.page.locator(".select__control");
  private memoSelectByIndex = this.allSelectControls.nth(1);
  private stellarMemoByDomPath = this.page.locator(
    "div:nth-child(2) > div:nth-child(4) > div:nth-child(2) > div:nth-child(2) > div > div > div:nth-child(2)",
  );
  private stellarMemoValueInput = this.stellarMemoByDomPath.locator("input").first();

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
    await expect(this.continueOrReview.first()).toBeVisible();
  }

  @step("Verify continue button is enabled")
  async expectContinueButtonEnabled() {
    await expect(this.continueOrReview.first()).toBeEnabled();
  }

  @step("Click continue button")
  async clickContinueButton() {
    if (await this.reviewButton.isVisible()) {
      await this.reviewButton.click();
    } else {
      await this.continueButton.click();
    }
  }

  @step("Verify memo tag field is visible")
  async expectMemoTagFilledVisible() {
    const mvvmVisible = await this.memoTagSummaryMvvm.isVisible();
    const legacyVisible = await this.memoTagSummaryLegacy.isVisible();
    expect(mvvmVisible || legacyVisible).toBeTruthy();
  }

  private async getSummaryLocator() {
    return (await this.memoTagSummaryMvvm.isVisible())
      ? this.memoTagSummaryMvvm
      : this.memoTagSummaryLegacy;
  }

  @step("Verify summary contains text")
  async expectSummaryContainsText(value: string) {
    const summary = await this.getSummaryLocator();
    await expect(summary).toContainText(value);
  }

  @step("Verify memo tag contains the right value")
  async expectSummaryNotContainMemoTag(value: string) {
    const summary = await this.getSummaryLocator();
    await expect(summary).not.toContainText(value);
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
    await expect(this.dontShowAgainCheckbox).toBeVisible();
  }

  @step("Verify 'Don't add Tag' button is visible")
  async expectDontAddTagButtonVisible() {
    await expect(this.dontAddTagButtonById).toBeVisible();
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
    await expect(this.amountInput.first()).toBeVisible();
  }
  @step("Fill amount input")
  async fillAmountInput(amount: string) {
    const input = (await this.amountInputMvvm.isVisible())
      ? this.amountInputMvvm
      : this.amountInputLegacy;
    await input.fill(amount);
  }

  @step("Select matched address or Continue to proceed to Amount step")
  async selectMatchedAddressAndProceed() {
    // Handles Stellar (send-matched-address-button, memo-tag-dont-add-button) and modal flows
    if (
      await this.matchedAddressBtn
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      await this.matchedAddressBtn.first().click();
    } else if (await this.dontAddTagBtn.isVisible().catch(() => false)) {
      await this.dontAddTagBtn.click();
    } else if (
      await this.continueBtn
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      await this.continueBtn.first().click();
      if (await this.dontAddTagBtn.isVisible().catch(() => false)) {
        await this.dontAddTagBtn.click();
      }
    } else {
      await expect(this.addressFirstItem).toBeVisible();
      await this.addressFirstItem.click();
    }
  }

  @step("Verify Stellar memo dropdown is visible")
  async expectStellarMemoVisible() {
    await expect(this.stellarMemoVisible).toBeVisible();
    await this.stellarMemoVisible.scrollIntoViewIfNeeded();
  }

  @step("Select Stellar memo type $0")
  async selectStellarMemoType(memoType: string) {
    const optionLabels: Record<string, string> = {
      NO_MEMO: "No Memo",
      MEMO_TEXT: "Memo Text",
      MEMO_ID: "Memo ID",
      MEMO_HASH: "Memo Hash",
      MEMO_RETURN: "Memo Return",
    };
    const optionLabel = optionLabels[memoType] ?? memoType.replace("_", " ");
    const optionTestId = `stellar-memo-option-${memoType.toLowerCase().replace("_", "-")}`;
    const newFlowOption = this.page.getByTestId(optionTestId);

    if (await this.stellarMemoNewFlowTrigger.isVisible().catch(() => false)) {
      await this.stellarMemoNewFlowTrigger.click();
      await newFlowOption.click();
      return;
    }

    const triggerToUse = this.legacyMemoTrigger.or(this.memoSelectByIndex);
    await triggerToUse.first().scrollIntoViewIfNeeded();
    await triggerToUse.first().click();

    const option = this.page
      .locator(".select__option")
      .filter({ hasText: optionLabel })
      .or(this.page.getByRole("option", { name: optionLabel }));
    await option.first().click();
  }

  @step("Fill Stellar memo value $0")
  async fillStellarMemoValue(value: string) {
    await this.stellarMemoValueInput.evaluate((el: HTMLElement, v: string) => {
      const inputEl = el instanceof HTMLInputElement ? el : el.querySelector("input");
      if (inputEl instanceof HTMLInputElement) {
        inputEl.focus();
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value",
        )?.set;
        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(inputEl, v);
        } else {
          inputEl.value = v;
        }
        inputEl.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }, value);
  }
}
