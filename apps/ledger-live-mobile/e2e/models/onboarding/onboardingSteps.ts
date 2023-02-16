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
  yesIDoButton = () => getElementByText("Yes, I do");
  notYetButton = () => getElementByText("Not yet");
  setupMyLedgerButton = () => getElementByText("Set up my Ledger");
  connectYourNanoButton = () => getElementByText("Connect your Nano");
  continueButton = () => getElementByText("Continue");
  pairNanoButton = () => getElementByText("Let’s pair my Nano"); // Yes it's a weird character, no do not replace it as it won't find the text
  pairDeviceButton = () => getElementById("pair-device");
  nanoDeviceButton = (name = "") => getElementByText(`Nano X de ${name}`);
  maybeLaterButton = () => getElementById("Maybe later");

  async startOnboarding() {
    await waitForElementByText("Get started");
    await tapByElement(this.onboardingGetStartedButton());
  }

  async DoIOwnDevice(answer = true) {
    answer
      ? await tapByElement(this.yesIDoButton())
      : await tapByElement(this.notYetButton());
  }

  async chooseToSetupLedger() {
    await tapByElement(this.setupMyLedgerButton());
  }

  async selectYourDevice(device: string) {
    await tapByText(device);
  }

  async chooseToConnectYourNano() {
    await tapByElement(this.connectYourNanoButton());
  }

  async verifyContentsOfBoxAreChecked() {
    await tapByElement(this.continueButton());
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
