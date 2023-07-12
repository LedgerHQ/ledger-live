import {
  getElementByText,
  tapByText,
  tapByElement,
  getElementById,
  waitForElementByText,
  waitForElementById,
  tapById,
  isAndroid,
} from "../../helpers";
import { device } from "detox";
import * as bridge from "../../bridge/server";

export default class OnboardingSteps {
  getStartedButtonId = "onboarding-getStarted-button";
  devicePairedContinueButtonId = "onboarding-paired-continue";
  exploreWithoutDeviceButtonId = "discoverLive-exploreWithoutADevice";
  discoverLiveTitle = (index: number) => `onboarding-discoverLive-${index}-title`;
  onboardingGetStartedButton = () => getElementById(this.getStartedButtonId);
  accessWalletButton = () =>
    getElementById("Onboarding PostWelcome - Selection|Access an existing wallet");
  noLedgerYetButton = () => getElementById("onboarding-noLedgerYet");
  exploreAppButton = () => getElementById("onboarding-noLedgerYetModal-explore");
  exploreWithoutDeviceButton = () => getElementById(this.exploreWithoutDeviceButtonId);
  connectLedgerButton = () => getElementById("Existing Wallet | Connect");
  continueButton = () => getElementById(this.devicePairedContinueButtonId);
  pairDeviceButton = () => getElementById("pair-device");
  pairNanoButton = () => getElementById("Onboarding-PairNewNano");
  nanoDeviceButton = (name = "") => getElementByText(`Nano X de ${name}`);
  maybeLaterButton = () => getElementById("notifications-prompt-later");

  async startOnboarding() {
    await waitForElementById(this.getStartedButtonId);
    await tapByElement(this.onboardingGetStartedButton());
  }

  async chooseToAccessYourWallet() {
    await tapByElement(this.accessWalletButton());
  }

  async chooseNoLedgerYet() {
    await tapByElement(this.noLedgerYetButton());
  }

  async chooseToExploreApp() {
    // Fixme : Found a way to skip discover carousel without disabling synchro (animations prevent click)
    if (isAndroid()) await device.disableSynchronization();
    await tapByElement(this.exploreAppButton());
    if (!isAndroid()) await device.disableSynchronization();
    for (let i = 0; i < 4; i++) {
      await waitForElementById(this.discoverLiveTitle(i));
      await tapById(this.discoverLiveTitle(i));
    }
    await waitForElementById(this.exploreWithoutDeviceButtonId);
    await tapById(this.exploreWithoutDeviceButtonId);
    await device.enableSynchronization();
  }

  async selectYourDevice(device: string) {
    await tapByText(device);
  }

  async chooseToConnectYourLedger() {
    await tapByElement(this.connectLedgerButton());
  }

  async chooseToPairMyNano() {
    await tapByElement(this.pairNanoButton());
  }

  async selectPairWithBluetooth() {
    await tapByElement(this.pairDeviceButton());
  }

  async addDeviceViaBluetooth(name = "David") {
    bridge.addDevices();
    await waitForElementByText(`Nano X de ${name}`);

    await tapByElement(this.nanoDeviceButton(name));

    bridge.setInstalledApps(); // tell LLM what apps the mock device has

    bridge.open(); // Mocked action open ledger manager on the Nano
  }

  async openLedgerLive() {
    await waitForElementById(this.devicePairedContinueButtonId);
    await tapByElement(this.continueButton());
  }

  async declineNotifications() {
    await tapByElement(this.maybeLaterButton());
  }
}
