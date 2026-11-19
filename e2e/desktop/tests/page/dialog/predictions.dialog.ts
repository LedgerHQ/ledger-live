import { expect, type Locator, type Page } from "@playwright/test";
import { step } from "tests/misc/reporters/step";
import { Dialog } from "tests/component/dialog.component";

const CTA_LABELS = {
  terms: "Agree and Continue",
  consent: "Continue",
} as const;

type PredictionsStep = keyof typeof CTA_LABELS;

export abstract class PredictionsDialog extends Dialog {
  protected readonly stepType: PredictionsStep;
  protected readonly dialog: Locator;
  private readonly checkbox: Locator;
  private readonly cta: Locator;
  private readonly dismissButton: Locator;

  constructor(page: Page, stepType: PredictionsStep) {
    super(page);
    this.stepType = stepType;
    this.dialog = this.page.getByTestId(`predictions-sheet-${stepType}`);
    this.checkbox = this.dialog.getByRole("checkbox");
    this.cta = this.dialog.getByRole("button", { name: CTA_LABELS[stepType], exact: true });
    this.dismissButton = this.dialog.getByRole("button", { name: "Close" });
  }

  @step("Verify the Predictions $stepType dialog is shown and not accepted")
  async expectNotAccepted() {
    await expect(this.dialog).toBeVisible();
    await expect(this.checkbox).not.toBeChecked();
    await expect(this.cta).toBeDisabled();
  }

  @step("Verify the Predictions $stepType dialog is not shown")
  async expectHidden() {
    await expect(this.dialog).toBeHidden();
  }

  @step("Close the Predictions $stepType dialog")
  async close() {
    await this.dismissButton.click();
    await expect(this.dialog).toBeHidden();
  }

  @step("Accept the Predictions $stepType dialog")
  async accept() {
    await this.checkbox.check();
    await expect(this.cta).toBeEnabled();
    await this.cta.click();
  }
}
