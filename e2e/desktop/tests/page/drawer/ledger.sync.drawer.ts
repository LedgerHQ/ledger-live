import { step } from "../../misc/reporters/step";
import { expect } from "@playwright/test";
import { Drawer } from "../../component/drawer.component";

export class LedgerSyncDrawer extends Drawer {
  private continueButton = this.page.getByRole("button", { name: "continue" });
  private readonly alreadyTurnedOnButton = this.page.getByRole("button", {
    name: "I already turned it on",
  });
  private walletSyncConnectDeviceButton = this.page.getByTestId(
    "walletSync-synchronize-connectDevice",
  );
  private closeLedgerSyncButton = this.page.getByRole("button", { name: "Close" });
  private deleteSyncButton = this.page.getByText("Delete sync");
  private confirmBackupDeletionButton = this.page.getByRole("button", { name: "Yes, delete" });
  private backupDeletionSuccessTextId = this.page.getByTestId(
    "walletsync-delete-backup-success-title",
  );
  private removeCliMemberSuccessText = this.page.getByText(
    "Your Ledger Wallet app on CLI is no longer connected to Ledger Sync",
  );
  private displayInstances = this.page.getByTestId("walletSync-manage-instances-label");
  private removeCLI = this.page.getByTestId("walletSync-manage-instance-CLI").getByText("Remove");
  private fromNowOnYourPortfolioIsSyncedText = this.page.getByText("From now on, your portfolio");

  @step("Synchronize accounts")
  async syncAccounts() {
    await this.expectSyncAccountsButtonExist();

    if (await this.walletSyncConnectDeviceButton.isVisible()) {
      await this.walletSyncConnectDeviceButton.click();
      return;
    }

    if (await this.continueButton.isVisible()) {
      await this.continueButton.click();
    } else if (await this.alreadyTurnedOnButton.isVisible()) {
      await this.alreadyTurnedOnButton.click();
    } else {
      throw new Error("No Ledger Sync entry-point button is visible.");
    }

    await expect(this.walletSyncConnectDeviceButton).toBeVisible();
    await this.walletSyncConnectDeviceButton.click();
  }

  @step("Close the Ledger Sync drawer")
  async closeLedgerSync() {
    await expect(this.closeLedgerSyncButton).toBeVisible();
    await this.closeLedgerSyncButton.click();
  }

  async waitForDeleteSyncButton() {
    await this.deleteSyncButton.waitFor({ state: "visible" });
  }

  @step("Delete Sync")
  async deleteSync() {
    await this.waitForDeleteSyncButton();
    await this.deleteSyncButton.click();
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

  /** Entry-step controls only; connect-device appears after advancing past these. */
  @step("Check if Ledger Sync entry controls exist")
  async expectSyncAccountsButtonExist() {
    await expect
      .poll(
        async () => {
          const hasContinue = await this.continueButton.isVisible();
          const hasAlreadyTurnedOn = await this.alreadyTurnedOnButton.isVisible();
          return hasContinue || hasAlreadyTurnedOn;
        },
        { timeout: 30000 },
      )
      .toBe(true);
  }

  @step("Check if synchronization was successful")
  async expectSynchronizationSuccess() {
    await expect(this.fromNowOnYourPortfolioIsSyncedText).toBeVisible();
  }

  @step("Check if the backup deletion was successful")
  async expectBackupDeletion() {
    await expect(this.backupDeletionSuccessTextId).toContainText(
      "Your Ledger Wallet apps are no longer synced",
    );
  }

  async waitForManageInstancesButton() {
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

  @step("Check if the member removal was successful")
  async expectMemberRemoval() {
    await expect(this.removeCliMemberSuccessText).toBeVisible();
  }
}
