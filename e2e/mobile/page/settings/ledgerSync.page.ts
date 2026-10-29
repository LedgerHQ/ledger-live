import { Step } from "jest-allure2-reporter/api";
import { activateLedgerSync, removeMemberLedgerSync } from "@ledgerhq/live-e2e-shared/speculos";
import { LedgerSyncCliHelper } from "@ledgerhq/live-e2e-shared/ledgerSync/helper";
import * as ledgerSyncSetup from "@ledgerhq/live-e2e-shared/ledgerSync/setup";
import type { LedgerSyncContactGroupDescriptor } from "@ledgerhq/live-e2e-shared/contacts";
import type { LedgerSyncAccountDescriptor } from "@ledgerhq/live-e2e-shared/ledgerSync/testData";
import { byId } from "@e2e/helpers/elements/native";

export default class LedgerSyncPage {
  /** The CLI member: the instance a test can remove, since the app is seeded as the other one. */
  get initialMemberPubKey() {
    return LedgerSyncCliHelper.initialMember.pubKey;
  }

  get ledgerSyncPushDataArgs() {
    return LedgerSyncCliHelper.ledgerSyncPushDataArgs;
  }

  private readonly successPage = byId("walletsync-success");
  private readonly confirmDeleteSyncButton = byId("delete-trustchain");
  private readonly deleteSyncButton = byId("walletSync-manage-backup");
  private readonly backupDeletionSuccessText = byId("walletsync-delete-backup-success-title");
  private readonly instanceRemovalSuccessText = byId("walletsync-remove-instance-success-title");
  private readonly useMyLedgerDeviceButton = byId("walletsync-choose-sync-method-connect-device");
  private readonly manageInstancesButton = byId("walletSync-manage-instances");
  private readonly activationTitle = byId("walletsync-activation-title");
  private readonly activationDescription = byId("walletsync-activation-description");
  private readonly activationButton = byId("walletsync-activation-button");
  private readonly activationSuccessCloseButton = byId("walletsync-activation-success-close");

  /** Instance rows are keyed by the member public key, which is what the CLI holds. */
  private readonly instanceRow = (memberPubKey: string) =>
    byId(`walletSync-manage-instance-${memberPubKey}`);
  /** The row itself is not touchable — only the Remove CTA inside it is. */
  private readonly instanceRemoveCta = (memberPubKey: string) =>
    byId(`walletSync-manage-instance-${memberPubKey}-cta`);

  @Step("Activate Ledger Sync on Speculos")
  async activateLedgerSyncOnSpeculos() {
    await activateLedgerSync();
  }

  @Step("Remove a member from Ledger Sync on Speculos")
  async removeMemberFromLedgerSyncOnSpeculos() {
    await removeMemberLedgerSync();
  }

  /**
   * Polls rather than asserting outright: the drawer animates in from the bottom, so the title can
   * be on screen but still clipped below the 75% visible-area threshold for a frame or two.
   */
  @Step("Expect Ledger Sync activation page is displayed")
  async expectLedgerSyncPageIsDisplayed() {
    await this.activationTitle.waitVisible();
    await this.activationDescription.waitVisible();
  }

  @Step("Tap on the activation button")
  async tapTurnOnSync() {
    // On Android its container's layout box ends above it, so Detox measures it ~61% visible
    // although the whole button is drawn on screen.
    await this.activationButton.tapExisting();
  }

  @Step("Tap on the use my ledger device button")
  async tapUseMyLedgerDevice() {
    await this.useMyLedgerDeviceButton.tap();
  }

  @Step("Expect Ledger Sync success page")
  async expectLedgerSyncSuccessPage() {
    await this.successPage.waitVisible();
  }

  @Step("Close the activation success page")
  async closeActivationSuccessPage() {
    await this.activationSuccessCloseButton.tap();
  }

  @Step("Expect Ledger Sync management screen is displayed")
  async expectLedgerSyncManagementVisible() {
    await this.manageInstancesButton.waitVisible();
    await this.deleteSyncButton.waitVisible();
  }

  @Step("Expect instance {{{0}}} removal to be successful")
  async expectMemberRemoval(memberName: string) {
    const text = await this.instanceRemovalSuccessText.getText();
    jestExpect(text).toBe(
      `Your Ledger Wallet app on ${memberName} is no longer connected to Ledger Sync`,
    );
  }

  @Step("Open the synchronized instances list")
  async openManageInstances() {
    await this.manageInstancesButton.tap();
  }

  @Step("Expect instance {{{0}}} to be listed")
  async expectInstanceVisible(memberPubKey: string) {
    await this.instanceRow(memberPubKey).waitVisible();
  }

  @Step("Expect instance {{{0}}} to be gone")
  async expectInstanceRemoved(memberPubKey: string) {
    await this.instanceRow(memberPubKey).waitGone();
  }

  @Step("Remove instance {{{0}}}")
  async removeInstance(memberPubKey: string) {
    await this.instanceRemoveCta(memberPubKey).tap();
  }

  @Step("Select delete sync")
  async openDeleteSync() {
    await this.deleteSyncButton.tap();
  }

  @Step("Confirm deletion of sync")
  async confirmDeleteSync() {
    await this.confirmDeleteSyncButton.tap();
  }

  @Step("Expect deletion success page")
  async expectBackupDeletion() {
    const text = await this.backupDeletionSuccessText.getText();
    jestExpect(text).toBe("Your Ledger Wallet apps are no longer synced");
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

  pushContactsToTrustchain(contactGroups: LedgerSyncContactGroupDescriptor[]) {
    return ledgerSyncSetup.pushContactsToTrustchain(contactGroups);
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
