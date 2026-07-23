import { expect } from "@playwright/test";
import { stat } from "fs/promises";
import { Modal } from "tests/component/modal.component";
import { step } from "tests/misc/reporters/step";
import { FileUtils } from "tests/utils/fileUtils";

export class SettingsModal extends Modal {
  readonly warningMessage = this.page.getByTestId("warning-message");
  readonly confirmButton = this.page.getByTestId("modal-confirm-button");

  @step("Check Reset Modal")
  async checkResetModal() {
    await expect(this.title).toHaveText("Reset Ledger Wallet");
    await expect(this.warningMessage).toHaveText(
      "Resetting Ledger Wallet will erase your swap transaction history for all your accounts.",
    );
  }

  @step("Click on Confirm Button")
  async clickOnConfirmButton() {
    await this.confirmButton.click();
  }

  @step("Verify app.json is regenerated after Reset app")
  async expectAppJsonRegenerated(userdataFile: string, previousSize: number) {
    await expect
      .poll(
        async () => {
          try {
            return (await stat(userdataFile)).size;
          } catch {
            return previousSize;
          }
        },
        { timeout: 60000, message: "app.json was not regenerated after Reset app" },
      )
      .not.toBe(previousSize);
    const currentSize = await FileUtils.getAppJsonSize(userdataFile);
    await FileUtils.compareAppJsonSize(previousSize, currentSize);
  }
}
