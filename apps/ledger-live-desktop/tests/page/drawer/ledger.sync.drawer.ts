import { step } from "tests/misc/reporters/step";
import { expect } from "@playwright/test";
import { Drawer } from "./drawer";
import { extractNumberFromText } from "tests/utils/textParserUtils";

export class LedgerSyncDrawer extends Drawer {
  private syncAccountsButton = this.page.getByRole("button", { name: "Sync your accounts" });
  private closeLedgerSyncButton = this.page.getByRole("button", { name: "Close" });
  private manageBackupButton = this.page.getByTestId("walletSync-manage-backup");
  private deleteBackupButton = this.page.getByTestId("walletSync-manage-backup-delete");
  private confirmBackupDeletionButton = this.page.getByRole("button", { name: "Delete" });
  private successTextElement = this.page.locator("span", { hasText: "Success" }).first();
  private backupDeletionSuccessText = this.page.getByText(
    "Your devices have been unsynchronized and your key has been deleted",
  );

  @step("Synchronize accounts")
  async syncAccounts() {
    await this.syncAccountsButton.click();
  }

  @step("Close the Ledger Sync drawer")
  async closeLedgerSync() {
    await this.closeLedgerSyncButton.click();
  }

  @step("Open the Manage Key section")
  async manageBackup() {
    await this.manageBackupButton.click();
  }

  @step("Click on the 'Delete your data' button")
  async deleteBackup() {
    await this.deleteBackupButton.click();
  }

  @step("Confirm the deletion of the data")
  async confirmBackupDeletion() {
    await this.confirmBackupDeletionButton.click();
  }

  @step("Destroy the trustchain - Delete the data")
  async destroyTrustchain() {
    await this.manageBackup();
    await this.deleteBackup();
    await this.confirmBackupDeletion();
  }

  @step("Check if sync entry point exists")
  async expectSyncAccountsButtonExist() {
    await expect(this.syncAccountsButton).toBeVisible();
  }

  @step("Check if synchronization was successful")
  async expectSynchronizationSuccess() {
    await expect(this.successTextElement).toBeVisible();
  }

  @step("Validate number of synchronized instances")
  async expectNbSyncedInstances(nb: number) {
    const countInstancesText = await this.page.getByText("Synchronized instance").textContent();
    const nbInstances = await extractNumberFromText(countInstancesText || "");
    expect(nbInstances).toBe(nb);
  }

  @step("Check if the backup deletion was successful")
  async expectBackupDeletion() {
    await expect(this.backupDeletionSuccessText).toBeVisible();
  }
}
