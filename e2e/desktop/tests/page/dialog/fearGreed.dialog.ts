import { step } from "../../misc/reporters/step";
import { Dialog } from "../../component/dialog.component";
import { expect } from "@playwright/test";

export class FearAndGreedDialog extends Dialog {
  private fearAndGreedDialogContent = this.page.getByTestId("fear-and-greed-dialog-content");
  private fearAndGreedDialogCta = this.page.getByTestId("fear-and-greed-dialog-cta");

  @step("Wait for dialog to be visible")
  async waitForDialogToBeVisible() {
    await expect(this.content).toBeVisible();
    await this.dialogOverlay.waitFor({ state: "attached" });
  }

  @step("Validate fear and greed dialog is visible")
  async isFearAndGreedDialogVisible(): Promise<boolean> {
    return await this.fearAndGreedDialogContent.isVisible();
  }

  @step("Validate fear and greed dialog elements")
  async validateFearAndGreedDialogItems() {
    await this.waitForDialogToBeVisible();
    await expect(this.fearAndGreedDialogContent).toBeVisible();
    await expect(this.closeButton).toBeVisible();
    await expect(this.fearAndGreedDialogCta).toBeVisible();
  }

  @step("Validate fear and greed dialog contains educational text")
  async validateFearAndGreedDialogContent() {
    await this.waitForDialogToBeVisible();
    const dialogText = await this.fearAndGreedDialogContent.textContent();
    expect(dialogText).toBeTruthy();
    expect(dialogText!.length).toBeGreaterThan(0);
  }

  @step("Close fear and greed dialog")
  async closeFearAndGreedDialog() {
    await this.closeButton.click();
  }

  @step("Close fear and greed dialog using CTA button")
  async closeFearAndGreedDialogWithCta() {
    await this.fearAndGreedDialogCta.click();
  }
}
