import { step } from "../../misc/reporters/step";
import { expect } from "@playwright/test";
import { Drawer } from "../../component/drawer.component";
import { extractNumberFromText } from "../../utils/textParserUtils";

export class LedgerSyncDrawer extends Drawer {
  private syncAccountsButton = this.page.getByRole("button", { name: "Turn on Ledger Sync" });
  private closeLedgerSyncButton = this.page.getByRole("button", { name: "Close" });
  private deleteSyncButton = this.page.getByText("Delete sync");
  private confirmBackupDeletionButton = this.page.getByRole("button", { name: "Yes, delete" });
  private successTextElement = this.page
    .locator("span", { hasText: "Ledger Sync turned on for" })
    .or(this.page.locator("span", { hasText: "Sync successful!" }))
    .first();
  private backupDeletionSuccessText = this.page.getByText(
    "Your Ledger Live apps are no longer synched",
  );
  private removeMemberSuccessText = this.page.getByText(
    "Your Ledger Live app on CLI is no longer connected to Ledger Sync",
  );
  private displayInstances = this.page
    .getByTestId("walletSync-manage-instances")
    .getByText("Manage");
  private removeCLI = this.page.getByTestId("walletSync-manage-instance-CLI").getByText("Remove");

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

  @step("Delete Sync")
  async deleteSync() {
    // Redundant check should be removed after this ticket is fixed: https://ledgerhq.atlassian.net/browse/LIVE-19021
    await this.deleteSyncButton.click();
    if (await this.deleteSyncButton.isVisible()) {
      await this.deleteSyncButton.click();
    }
  }

  @step("Confirm the deletion of the data")
  async confirmBackupDeletion() {
    await expect(this.confirmBackupDeletionButton).toBeVisible();
    await this.confirmBackupDeletionButton.click();
  }

  @step("Destroy the trustchain - Delete the data")
  async destroyTrustchain() {
    await this.deleteSync();
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

  @step("Manage instances")
  async manageInstances() {
    // Redundant check should be removed after this ticket is fixed: https://ledgerhq.atlassian.net/browse/LIVE-19021
    await this.displayInstances.click();
    if (await this.displayInstances.isVisible()) {
      await this.displayInstances.click();
    }
  }

  @step("Remove ClI member")
  async removeCLIMember() {
    await this.removeCLI.click();
  }

  @step("Check if the member removal was successful")
  async expectMemberRemoval() {
    await expect(this.removeMemberSuccessText).toBeVisible();
  }
}
