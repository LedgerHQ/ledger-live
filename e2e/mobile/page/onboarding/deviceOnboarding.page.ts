import ConnectDevicePage from "@e2e/page/onboarding/deviceOnboarding/connectDevice.page";
import DeviceChecksPage from "@e2e/page/onboarding/deviceOnboarding/deviceChecks.page";
import FirmwareUpdatePage from "@e2e/page/onboarding/deviceOnboarding/firmwareUpdate.page";
import SyncOfferPage from "@e2e/page/onboarding/deviceOnboarding/syncOffer.page";
import FirmwareUpdateOfferDrawer from "@e2e/page/drawer/firmwareUpdateOffer.drawer";
import QuitConfirmationDrawer from "@e2e/page/drawer/quitConfirmation.drawer";
import SkipSyncDrawer from "@e2e/page/drawer/skipSync.drawer";

/** The screens and drawers of the device onboarding funnel. */
export default class DeviceOnboardingPage {
  connect = new ConnectDevicePage();
  checks = new DeviceChecksPage();
  firmwareUpdate = new FirmwareUpdatePage();
  syncOffer = new SyncOfferPage();
  firmwareUpdateOfferDrawer = new FirmwareUpdateOfferDrawer();
  quitConfirmationDrawer = new QuitConfirmationDrawer();
  skipSyncDrawer = new SkipSyncDrawer();
}
