import { Step } from "jest-allure2-reporter/api";
import { activateLedgerSync } from "@ledgerhq/live-common/e2e/speculos";

export default class LedgerSyncPage {
  successPage = "walletsync-success";
  confirmDeleteSyncId = "delete-trustchain";
  deleteSyncId = "walletSync-manage-backup";
  backupDeletionSuccessTextId = "walletsync-delete-backup-success-title";
  useMyLedgerDeviceButtonId = "walletsync-choose-sync-method-connect-device";

  activationButton = () => getElementById("walletsync-activation-button");
  activationTitle = () => getElementById("walletsync-activation-title");
  activationDescription = () => getElementById("walletsync-activation-description");
  activationSuccessCloseButton = () => getElementById("walletsync-activation-success-close");
  deletionSuccessCloseButton = () => getElementById("walletsync-deletion-success-close");

  @Step("Activate Ledger Sync on Speculos")
  async activateLedgerSyncOnSpeculos() {
    await activateLedgerSync();
  }

  @Step("Expect Ledger Sync activation page is displayed")
  async expectLedgerSyncPageIsDisplayed() {
    await detoxExpect(this.activationTitle()).toBeVisible();
    await detoxExpect(this.activationDescription()).toBeVisible();
  }

  @Step("Tap on the activation button")
  async tapTurnOnSync() {
    await tapByElement(this.activationButton());
  }

  @Step("Tap on the use my ledger device button")
  async tapUseMyLedgerDevice() {
    await tapById(this.useMyLedgerDeviceButtonId);
  }

  @Step("Expect Ledger Sync success page")
  async expectLedgerSyncSuccessPage() {
    await waitForElementById(this.successPage);
  }

  @Step("Close the activation success page")
  async closeActivationSuccessPage() {
    await tapByElement(this.activationSuccessCloseButton());
  }

  @Step("Select delete sync")
  async openDeleteSync() {
    await waitForElementById(this.deleteSyncId);
    await tapById(this.deleteSyncId);
  }

  @Step("Confirm deletion of sync")
  async confirmDeleteSync() {
    await waitForElementById(this.confirmDeleteSyncId);
    await tapById(this.confirmDeleteSyncId);
  }

  @Step("Expect deletion success page")
  async expectBackupDeletion() {
    await waitForElementById(this.backupDeletionSuccessTextId);
    await detoxExpect(getElementById(this.backupDeletionSuccessTextId)).toHaveText(
      "Your Ledger Wallet apps are no longer synced",
    );
  }
}
