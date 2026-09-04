import { Step } from "jest-allure2-reporter/api";
import { activateLedgerSync, removeMemberLedgerSync } from "@ledgerhq/live-e2e-shared/speculos";
import { LedgerSyncCliHelper } from "@ledgerhq/live-e2e-shared/ledgerSync/helper";
import * as ledgerSyncSetup from "@ledgerhq/live-e2e-shared/ledgerSync/setup";
import type { LedgerSyncAccountDescriptor } from "@ledgerhq/live-e2e-shared/ledgerSync/testData";

export default class LedgerSyncPage {
  /** CLI state lives in the shared helper so desktop and mobile drive the trustchain the same way. */
  get ledgerKeyRingProtocolArgs() {
    return LedgerSyncCliHelper.ledgerKeyRingProtocolArgs;
  }

  /** The CLI member: the instance a test can remove, since the app is seeded as the other one. */
  get initialMemberPubKey() {
    return LedgerSyncCliHelper.initialMember.pubKey;
  }

  get ledgerSyncPushDataArgs() {
    return LedgerSyncCliHelper.ledgerSyncPushDataArgs;
  }

  successPage = "walletsync-success";
  confirmDeleteSyncId = "delete-trustchain";
  deleteSyncId = "walletSync-manage-backup";
  backupDeletionSuccessTextId = "walletsync-delete-backup-success-title";
  useMyLedgerDeviceButtonId = "walletsync-choose-sync-method-connect-device";
  manageInstancesId = "walletSync-manage-instances";

  activationButton = () => getElementById("walletsync-activation-button");
  activationTitle = () => getElementById("walletsync-activation-title");
  activationDescription = () => getElementById("walletsync-activation-description");
  activationSuccessCloseButton = () => getElementById("walletsync-activation-success-close");
  deletionSuccessCloseButton = () => getElementById("walletsync-deletion-success-close");

  /** Instance rows are keyed by the member public key, which is what the CLI holds. */
  private instanceRowId(memberPubKey: string) {
    return `walletSync-manage-instance-${memberPubKey}`;
  }

  @Step("Activate Ledger Sync on Speculos")
  async activateLedgerSyncOnSpeculos() {
    await activateLedgerSync();
  }

  @Step("Remove a member from Ledger Sync on Speculos")
  async removeMemberFromLedgerSyncOnSpeculos() {
    await removeMemberLedgerSync();
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

  @Step("Open the synchronized instances list")
  async openManageInstances() {
    await waitForElementById(this.manageInstancesId);
    await tapById(this.manageInstancesId);
  }

  @Step("Expect instance $0 to be listed")
  async expectInstanceVisible(memberPubKey: string) {
    await waitForElementById(this.instanceRowId(memberPubKey));
  }

  @Step("Expect instance $0 to be gone")
  async expectInstanceRemoved(memberPubKey: string) {
    await waitForElementNotVisible(this.instanceRowId(memberPubKey));
  }

  /** The row itself is not touchable — only the Remove CTA inside it is. */
  @Step("Remove instance $0")
  async removeInstance(memberPubKey: string) {
    await tapById(`${this.instanceRowId(memberPubKey)}-cta`);
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

  /**
   * Speculos reads `process.env.SEED` when it launches, and Jest hands each test file a *copy* of
   * `process.env` — so a spec setting the seed itself would only ever change its own copy while
   * Speculos keeps booting on the shell's real seed. The swap has to happen on this side.
   */
  useGeneratedSeed() {
    const previousSeed = process.env.SEED;
    process.env.SEED = ledgerSyncSetup.generateLedgerSyncSeed();
    return previousSeed;
  }

  restoreSeed(previousSeed?: string) {
    if (previousSeed === undefined) delete process.env.SEED;
    else process.env.SEED = previousSeed;
  }

  /**
   * Setup commands are reached through the page object rather than imported by the spec. The test
   * environment builds the page objects in Jest's host module registry while a spec's own imports
   * are evaluated in the sandbox one, so a spec importing the shared helper gets a second copy of
   * it: the trustchain would be created against one set of statics and read back from an empty
   * other. Everything that touches trustchain state has to enter through `app`.
   */
  initializeEmptyTrustchain() {
    return ledgerSyncSetup.initializeEmptyTrustchain();
  }

  pushAccountsToTrustchain(
    descriptors: LedgerSyncAccountDescriptor[],
    accountNames: Record<string, string> = {},
  ) {
    return ledgerSyncSetup.pushAccountsToTrustchain(descriptors, accountNames);
  }

  addTrustchainMember(name: string) {
    return ledgerSyncSetup.addTrustchainMember(name);
  }

  saveTrustchainToUserdata(userdataPath?: string) {
    return LedgerSyncCliHelper.saveTrustchainToUserdata(userdataPath);
  }

  destroyTrustchain() {
    return ledgerSyncSetup.destroyTrustchain();
  }
}
