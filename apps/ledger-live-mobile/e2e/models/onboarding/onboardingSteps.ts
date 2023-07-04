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

  chooseToSetupLedger() {
    return tapByElement(this.setupLedgerButton());
  }

  chooseToAccessYourWallet() {
    return tapByElement(this.accessWalletButton());
  }

  selectYourDevice(device: string) {
    return tapByText(device);
  }

  chooseToConnectYourLedger() {
    return tapByElement(this.connectLedgerButton());
  }

  chooseToPairMyNano() {
    return tapByElement(this.pairNanoButton());
  }

  selectPairWithBluetooth() {
    return tapByElement(this.pairDeviceButton());
  }

  async addDeviceViaBluetooth(name = "David") {
    bridge.addDevices();
    await waitForElementByText(`Nano X de ${name}`);

    await tapByElement(this.nanoDeviceButton(name));

    bridge.setInstalledApps(); // tell LLM what apps the mock device has

    bridge.openNano(); // Mocked action open ledger manager on the Nano
  }

  async openLedgerLive() {
    await waitForElementByText("Continue");
    await tapByElement(this.continueButton());
  }

  declineNotifications() {
    return tapByElement(this.maybeLaterButton());
  }
}
