import { expect } from "@playwright/test";
import { Modal } from "tests/component/modal.component";
import { step } from "tests/misc/reporters/step";
import { FileUtils } from "tests/utils/fileUtils";
import { waitForIdentitiesRegenerated } from "tests/utils/userdata";
import { TIMEOUT } from "@ledgerhq/live-e2e-shared/timeouts";

export class SettingsModal extends Modal {
  readonly warningMessage = this.page.getByTestId("warning-message");
  readonly confirmButton = this.page.getByTestId("modal-confirm-button");

  @step("Check Reset Modal")
  async checkResetModal() {
    await expect(this.title).toBeVisible();
    await this.softExpect(async soft => {
      await soft(this.title).toHaveText("Reset Ledger Wallet");
      await soft(this.warningMessage).toHaveText(
        "Resetting Ledger Wallet will erase your swap transaction history for all your accounts.",
      );
    });
  }

  @step("Click on Confirm Button")
  async clickOnConfirmButton() {
    await this.confirmButton.click();
  }

  @step("Verify identities are regenerated after Reset app")
  async expectIdentitiesRegenerated(userdataFile: string, previousUserId: string) {
    await waitForIdentitiesRegenerated(userdataFile, previousUserId);
  }

  @step("Expect the stale app.json backup to be cleaned up after Reset app")
  async expectStaleBackupRemoved(backupFile: string) {
    await this.softExpect(async soft => {
      soft(
        await FileUtils.waitForFileToBeRemoved(backupFile, TIMEOUT.medium),
        "stale app.json.* backup should be cleaned up on the Reset-app reboot",
      ).toBeTruthy();
    });
  }
}
