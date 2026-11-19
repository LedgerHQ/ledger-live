import { Step } from "jest-allure2-reporter/api";
import { byId } from "@e2e/helpers/elements/native";
import { TIMEOUT } from "@e2e/utils/timeouts";

/** The device onboarding funnel (`deviceOnboarding` flag) as a seeded device walks it. */
export default class DeviceOnboardingPage {
  private readonly addDeviceEntry = byId(/^(select-device-add-new|connect-with-bluetooth)$/);
  private readonly connectDiscovering = byId(/^connect-new-device-discovering-/);
  private readonly connectClose = byId("onboarding-connect-close");
  private readonly deviceSelectButton = byId(/^connect-new-device-select-/);

  private readonly checksScreen = byId("device-onboarding-checks");
  private readonly checksStart = byId("device-onboarding-checks-start");
  private readonly checksContinue = byId("device-onboarding-checks-continue");
  private readonly checksQuit = byId("device-onboarding-checks-quit");
  private readonly skipUpdate = byId("device-onboarding-checks-skip-update");
  private readonly unlockSheet = byId("device-onboarding-unlock-sheet");
  private readonly powerOnSheet = byId("device-onboarding-power-on-sheet");

  private readonly firmwareUpdateDrawer = byId("firmware-update-available-drawer");
  private readonly firmwareUpdateDrawerUpdate = byId("firmware-update-available-drawer-update");
  private readonly legacyDrawerClose = byId("modal-close-button");
  private readonly firmwareReleaseNotes = byId("firmware-update-release-notes");

  private readonly quitConfirmation = byId("device-onboarding-quit-confirmation");
  private readonly quitConfirmationLeave = byId("device-onboarding-quit-confirmation-leave");

  private readonly syncOfferScreen = byId("device-onboarding-sync-offer");
  private readonly syncOfferActivate = byId("device-onboarding-sync-offer-activate");
  private readonly syncOfferSkip = byId("device-onboarding-sync-offer-skip");
  private readonly syncOfferQuit = byId("device-onboarding-sync-offer-quit");
  private readonly skipSyncDrawer = byId("sync-onboarding-drawer-skip");
  private readonly skipSyncConfirm = byId("sync-onboarding-drawer-skipCTA");

  private readonly ledgerSyncDeviceStepClose = byId("bottom-sheet-header-close-button");

  /** My Ledger shows a different add CTA depending on whether it already lists a device. */
  @Step("Tap the add a device entry of My Ledger")
  async tapAddDevice() {
    await this.addDeviceEntry.tap();
  }

  @Step("Expect the funnel Connect screen")
  async expectConnectScreen() {
    await this.connectDiscovering.waitVisible(TIMEOUT.xlarge);
  }

  @Step("Select the discovered device")
  async selectDevice() {
    await this.deviceSelectButton.tap(TIMEOUT.xlarge);
  }

  @Step("Close the funnel Connect screen")
  async closeConnectScreen() {
    await this.connectClose.tap();
  }

  @Step("Expect the checks screen waiting for start")
  async expectChecksIdle() {
    await this.checksStart.waitVisible(TIMEOUT.xlarge);
  }

  @Step("Start the checks")
  async startChecks() {
    await this.checksStart.tap();
  }

  @Step("Expect the checks to succeed")
  async expectChecksSucceeded() {
    await this.checksContinue.waitVisible(TIMEOUT.xxlarge);
  }

  @Step("Continue after the checks")
  async continueAfterChecks() {
    await this.checksContinue.tap();
  }

  @Step("Close the checks screen")
  async quitChecks() {
    await this.checksQuit.tap();
  }

  @Step("Expect the checks screen to be gone")
  async expectChecksClosed() {
    await this.checksScreen.waitNotVisible();
  }

  @Step("Expect the firmware update offer")
  async expectFirmwareUpdateOffer() {
    await this.firmwareUpdateDrawer.waitFullyVisible(TIMEOUT.xxlarge);
  }

  @Step("Accept the firmware update")
  async acceptFirmwareUpdate() {
    await this.firmwareUpdateDrawerUpdate.tap();
  }

  /** Closing the sheet leaves the checks screen on its Install / Skip choice. */
  @Step("Dismiss the firmware update offer")
  async dismissFirmwareUpdateOffer() {
    await this.legacyDrawerClose.tap();
    await this.firmwareUpdateDrawer.waitNotVisible();
  }

  @Step("Skip the firmware update")
  async skipFirmwareUpdate() {
    await this.skipUpdate.tap();
  }

  @Step("Expect the firmware update screen")
  async expectFirmwareUpdateScreen() {
    await this.firmwareReleaseNotes.waitVisible(TIMEOUT.xlarge);
  }

  @Step("Expect the device locked sheet")
  async expectUnlockSheet() {
    await this.unlockSheet.waitFullyVisible(TIMEOUT.xxlarge);
  }

  @Step("Expect the device locked sheet to close")
  async expectUnlockSheetClosed() {
    await this.unlockSheet.waitNotVisible(TIMEOUT.xxlarge);
  }

  @Step("Expect the power on sheet")
  async expectPowerOnSheet() {
    await this.powerOnSheet.waitFullyVisible(TIMEOUT.xxlarge);
  }

  @Step("Expect the power on sheet to close")
  async expectPowerOnSheetClosed() {
    await this.powerOnSheet.waitNotVisible(TIMEOUT.xxlarge);
  }

  @Step("Leave from the quit confirmation")
  async leaveFromQuitConfirmation() {
    await this.quitConfirmation.waitFullyVisible();
    await this.quitConfirmationLeave.tap();
  }

  @Step("Expect the Ledger Sync offer")
  async expectSyncOffer() {
    await this.syncOfferActivate.waitVisible(TIMEOUT.xlarge);
  }

  @Step("Expect the Ledger Sync offer to be gone")
  async expectSyncOfferClosed() {
    await this.syncOfferScreen.waitNotVisible();
  }

  @Step("Activate Ledger Sync from the offer")
  async activateSync() {
    await this.syncOfferActivate.tap();
  }

  /** The step is the Device Intent Executor sheet over the offer (`lwmLedgerSyncDie`). */
  @Step("Close the Ledger Sync device step")
  async closeLedgerSyncDeviceStep() {
    await this.ledgerSyncDeviceStepClose.waitFullyVisible(TIMEOUT.xlarge);
    await this.ledgerSyncDeviceStepClose.tap();
    await this.ledgerSyncDeviceStepClose.waitNotVisible();
  }

  @Step("Skip Ledger Sync and confirm")
  async skipSync() {
    await this.syncOfferSkip.tap();
    await this.skipSyncDrawer.waitFullyVisible();
    await this.skipSyncConfirm.tap();
  }

  @Step("Close the Ledger Sync offer")
  async quitSyncOffer() {
    await this.syncOfferQuit.tap();
  }
}
