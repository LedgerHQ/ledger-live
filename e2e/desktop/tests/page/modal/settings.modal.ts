import { expect } from "@playwright/test";
import { Modal } from "tests/component/modal.component";
import { step } from "tests/misc/reporters/step";
import { waitForIdentitiesRegenerated } from "tests/utils/userdata";

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

  @step("Verify identities are regenerated after Reset app")
  async expectIdentitiesRegenerated(userdataFile: string, previousUserId: string) {
    await waitForIdentitiesRegenerated(userdataFile, previousUserId);
  }
}
