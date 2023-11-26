import {
  tapByText,
  tapByElement,
  getElementById,
  waitForElementById,
  tapById,
  waitForElementByText,
} from "../../helpers";
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
    await tapByElement(this.exploreAppButton());
    for (let i = 0; i < 4; i++) {
      await tapById(this.discoverLiveTitle(i));
    }
    await tapById(this.exploreWithoutDeviceButtonId);
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
    await tapByElement(this.pairDeviceButton());
    bridge.addDevices();
    await waitForElementByText(this.deviceName(name));
    await tapByText(this.deviceName(name));
    bridge.setInstalledApps(); // tell LLM what apps the mock device has
    bridge.open(); // Mocked action open ledger manager on the Nano
    await waitForElementById("onboarding-paired-continue");
  }

  async openLedgerLive() {
    await waitForElementById(this.devicePairedContinueButtonId);
    await tapByElement(this.continueButton());
  }

  async declineNotifications() {
    await tapByElement(this.maybeLaterButton());
  }
}
