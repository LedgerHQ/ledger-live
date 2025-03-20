import { activateLedgerSync } from "@ledgerhq/live-common/e2e/speculos";
import { expect } from "detox";

export default class LedgerSyncPage {
  activationButton = () => getElementById("walletsync-activation-button");
  useLedgerButton = () => getElementById("walletsync-choose-sync-method-connect-device");
  activationTitle = () => getElementById("walletsync-activation-title");
  activationDescription = () => getElementById("walletsync-activation-description");
  successPage = "walletsync-success";
  activationSuccessCloseButton = () => getElementById("walletsync-activation-success-close");
  deleteSync = () => getElementById("walletSync-manage-backup");
  confirmDeleteSyncId = "delete-trustchain";
  deletionSuccessCloseButton = () => getElementById("walletsync-deletion-success-close");

  @Step("Activate Ledger Sync on Speculos")
  async activateLedgerSyncOnSpeculos() {
    await activateLedgerSync();
  }

  @Step("Expect Ledger Sync activation page is displayed")
  async expectLedgerSyncPageIsDisplayed() {
    await expect(this.activationTitle()).toBeVisible();
    await expect(this.activationDescription()).toBeVisible();
  }

  @Step("Tap on the activation button")
  async tapTurnOnSync() {
    await tapByElement(this.activationButton());
  }

  @Step("Select Use Ledger")
  async selectUseLedger() {
    await tapByElement(this.useLedgerButton());
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
    await tapByElement(this.deleteSync());
  }

  @Step("Confirm deletion of sync")
  async confirmDeleteSync() {
    await waitForElementById(this.confirmDeleteSyncId);
    await tapById(this.confirmDeleteSyncId);
  }

  @Step("Expect deletion success page")
  async closeDeletionSuccessPage() {
    await waitForElementById(this.successPage);
    await tapByElement(this.deletionSuccessCloseButton());
  }
}
