import { step } from "tests/misc/reporters/step";
import { expect } from "@playwright/test";
import { Drawer } from "../../component/drawer.component";
import { extractNumberFromText } from "tests/utils/textParserUtils";

export class LedgerSyncDrawer extends Drawer {
  private syncAccountsButton = this.page.getByRole("button", { name: "Turn on Ledger Sync" });
  private closeLedgerSyncButton = this.page.getByRole("button", { name: "Close" });
  private manageBackupButton = this.page.getByTestId("walletSync-manage-backup");
  private confirmBackupDeletionButton = this.page.getByRole("button", { name: "Yes, delete" });
  private successTextElement = this.page
    .locator("span", { hasText: "Ledger Sync turned on for" })
    .or(this.page.locator("span", { hasText: "Sync successful!" }))
    .first();
  private backupDeletionSuccessText = this.page.getByText(
    "Your Ledger Live apps are no longer synched",
  );

  @step("Synchronize accounts")
  async syncAccounts() {
    await expect(this.syncAccountsButton).toBeVisible();
    await this.syncAccountsButton.click();
  }

  @step("Close the Ledger Sync drawer")
  async closeLedgerSync() {
    await expect(this.closeLedgerSyncButton).toBeVisible();
    await this.closeLedgerSyncButton.click();
  }

  @step("Open the Manage Key section")
  async manageBackup() {
    await expect(this.manageBackupButton).toBeVisible();
    await this.manageBackupButton.click({ force: true });
  }

  @step("Confirm the deletion of the data")
  async confirmBackupDeletion() {
    await expect(this.confirmBackupDeletionButton).toBeVisible();
    await this.confirmBackupDeletionButton.click();
  }

  @step("Destroy the trustchain - Delete the data")
  async destroyTrustchain() {
    await this.manageBackup();
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
