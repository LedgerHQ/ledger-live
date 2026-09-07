import { step } from "tests/misc/reporters/step";
import { expect } from "@playwright/test";
import { Drawer } from "tests/component/drawer.component";

export class LedgerSyncDrawer extends Drawer {
  private deleteSyncButton = this.page.getByText("Delete sync");
  private confirmBackupDeletionButton = this.page.getByRole("button", { name: "Yes, delete" });
  private backupDeletionSuccessTextId = this.page.getByTestId(
    "walletsync-delete-backup-success-title",
  );
  private removeCliMemberSuccessText = this.page.getByText(
    "Your Ledger Wallet app on CLI is no longer connected to Ledger Sync",
  );
  private displayInstances = this.page.getByTestId("walletSync-manage-instances-label");
  private readonly cliMember = this.page.getByTestId("walletSync-manage-instance-CLI");
  private readonly removeCLI = this.cliMember.getByText("Remove");
  private readonly activateTitle = this.page.getByTestId("walletsync-activate-title");
  private readonly turnOnLedgerSyncButton = this.page.getByTestId("walletsync-activate-cta");
  private readonly connectDeviceButton = this.page.getByTestId(
    "walletSync-synchronize-connectDevice",
  );
  private readonly activateSuccessTitle = this.page.getByTestId(
    "walletsync-activate-success-title",
  );

  private async waitForDeleteSyncButton() {
    await this.deleteSyncButton.waitFor({ state: "visible" });
  }

  @step("Expect activation screen to be visible")
  async expectActivationScreenVisible() {
    await expect(this.activateTitle).toBeVisible();
    await expect(this.turnOnLedgerSyncButton).toBeVisible();
  }

  @step("Click 'Turn on Ledger Sync'")
  async clickTurnOnLedgerSync() {
    await this.turnOnLedgerSyncButton.click();
  }

  @step("Click 'Use your Ledger' to sync with device")
  async clickConnectDevice() {
    await this.connectDeviceButton.waitFor({ state: "visible" });
    await this.connectDeviceButton.click();
  }

  @step("Expect activation success screen")
  async expectActivationSuccess() {
    await expect(this.activateSuccessTitle).toContainText("Sync complete");
  }

  @step("Check if Ledger Sync management drawer is visible")
  async expectLedgerSyncManagementVisible() {
    await expect(this.deleteSyncButton).toBeVisible();
    await expect(this.displayInstances).toBeVisible();
  }

  @step("Delete Sync")
  private async deleteSync() {
    await this.waitForDeleteSyncButton();
    await this.deleteSyncButton.click();
  }

  @step("Confirm the deletion of the data")
  private async confirmBackupDeletion() {
    await expect(this.confirmBackupDeletionButton).toBeVisible();
    await this.confirmBackupDeletionButton.click();
  }

  @step("Destroy the trustchain - Delete the data")
  async destroyTrustchain() {
    await this.deleteSync();
    await this.confirmBackupDeletion();
  }

  @step("Check if the backup deletion was successful")
  async expectBackupDeletion() {
    await expect(this.backupDeletionSuccessTextId).toContainText(
      "Your Ledger Wallet apps are no longer synced",
    );
  }

  private async waitForManageInstancesButton() {
    await this.displayInstances.waitFor({ state: "visible" });
  }

  @step("Manage instances")
  async manageInstances() {
    await this.waitForManageInstancesButton();
    await this.displayInstances.click();
  }

  @step("Remove ClI member")
  async removeCLIMember() {
    await this.removeCLI.click();
  }

  @step("Check if the CLI member is visible")
  async expectCLIMemberVisible() {
    await expect(this.cliMember).toBeVisible();
  }

  @step("Check if the CLI member is not visible")
  async expectCLIMemberRemoved() {
    await expect(this.cliMember).not.toBeVisible();
  }

  @step("Check if the member removal was successful")
  async expectMemberRemoval() {
    await expect(this.removeCliMemberSuccessText).toBeVisible();
  }
}
