import {
  getElementByText,
  tapByText,
  tapByElement,
  getElementById,
  waitForElementByText,
} from "../../helpers";
import * as bridge from "../../bridge/server";

export default class OnboardingSteps {
  onboardingGetStartedButton = () => getElementByText("Get started");
  setupLedgerButton = () => getElementByText("Set up your Ledger");
  accessWalletButton = () => getElementByText("Access your wallet");
  connectLedgerButton = () => getElementByText("Connect your Ledger");
  continueButton = () => getElementByText("Continue");
  pairNanoButton = () => getElementByText("Let’s pair my Nano"); // Yes it's a weird character, no do not replace it as it won't find the text
  pairDeviceButton = () => getElementById("pair-device");
  nanoDeviceButton = (name = "") => getElementByText(`Nano X de ${name}`);
  maybeLaterButton = () => getElementById("Maybe later");

  async startOnboarding() {
    await waitForElementByText("Get started");
    await tapByElement(this.onboardingGetStartedButton());
  }

  async chooseToSetupLedger() {
    await tapByElement(this.setupLedgerButton());
  }

  async chooseToAccessYourWallet() {
    await tapByElement(this.accessWalletButton());
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
    await waitForElementByText("Continue");
    await tapByElement(this.continueButton());
  }

  async declineNotifications() {
    await tapByElement(this.maybeLaterButton());
  }
}
