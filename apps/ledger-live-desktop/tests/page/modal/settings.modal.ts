import { expect } from "@playwright/test";
import { Modal } from "../../component/modal.component";
import { step } from "tests/misc/reporters/step";

export class SettingsModal extends Modal {
  readonly warningMessage = this.page.getByTestId("warning-message");
  readonly confirmButton = this.page.getByTestId("modal-confirm-button");

  @step("Check Reset Modal")
  async checkResetModal() {
    await expect(this.title).toHaveText("Reset Ledger Live");
    await expect(this.warningMessage).toHaveText(
      "Resetting Ledger Live will erase your swap transaction history for all your accounts.",
    );
  }

  @step("Click on Confirm Button")
  async clickOnConfirmButton() {
    await this.confirmButton.click();
  }
}
