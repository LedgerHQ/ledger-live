import {
  tapByText,
  tapByElement,
  getElementById,
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
  deviceName = (name = "") => `Nano X de ${name}`;
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
    await device.disableSynchronization(); // Animations prevent click
    await tapByElement(this.exploreAppButton());
    // Fixme : Found a way to skip discover carousel first page on iOS
    for (let i = isAndroid() ? 0 : 1; i < 4; i++) {
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

  async addDeviceViaBluetooth(name = "David") {
    await device.disableSynchronization(); // Scanning animation prevents launching mocks
    await tapByElement(this.pairDeviceButton());
    bridge.addDevices();
    await device.enableSynchronization();
    await tapByText(this.deviceName(name));
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
