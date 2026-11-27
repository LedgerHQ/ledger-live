import ConnectDevicePage from "@e2e/page/onboarding/deviceOnboarding/connectDevice.page";
import DeviceChecksPage from "@e2e/page/onboarding/deviceOnboarding/deviceChecks.page";
import FirmwareUpdatePage from "@e2e/page/onboarding/deviceOnboarding/firmwareUpdate.page";
import IntroKaraokePage from "@e2e/page/onboarding/deviceOnboarding/introKaraoke.page";
import RecoverNewSeedPage from "@e2e/page/onboarding/deviceOnboarding/recoverNewSeed.page";
import RecoverRestorePage from "@e2e/page/onboarding/deviceOnboarding/recoverRestore.page";
import SetupPage from "@e2e/page/onboarding/deviceOnboarding/setup.page";
import SuccessKaraokePage from "@e2e/page/onboarding/deviceOnboarding/successKaraoke.page";
import SyncOfferPage from "@e2e/page/onboarding/deviceOnboarding/syncOffer.page";
import FirmwareUpdateOfferDrawer from "@e2e/page/drawer/firmwareUpdateOffer.drawer";
import RecoverDetailsDrawer from "@e2e/page/drawer/recoverDetails.drawer";
import QuitConfirmationDrawer from "@e2e/page/drawer/quitConfirmation.drawer";
import SkipSyncDrawer from "@e2e/page/drawer/skipSync.drawer";

/** The screens and drawers of the device onboarding funnel. */
export default class DeviceOnboardingPage {
  connect = new ConnectDevicePage();
  checks = new DeviceChecksPage();
  introKaraoke = new IntroKaraokePage();
  setup = new SetupPage();
  recoverNewSeed = new RecoverNewSeedPage();
  recoverRestore = new RecoverRestorePage();
  successKaraoke = new SuccessKaraokePage();
  firmwareUpdate = new FirmwareUpdatePage();
  syncOffer = new SyncOfferPage();
  firmwareUpdateOfferDrawer = new FirmwareUpdateOfferDrawer();
  recoverDetailsDrawer = new RecoverDetailsDrawer();
  quitConfirmationDrawer = new QuitConfirmationDrawer();
  skipSyncDrawer = new SkipSyncDrawer();
}
