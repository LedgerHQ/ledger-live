import {
  getElementByText,
  tapByText,
  tapByElement,
  getElementById,
} from "../../helpers";
import * as bridge from "../../bridge/server";

export default class OnboardingSteps {
  getOnboardingGetStarted = () => getElementByText("Get started");
  getYesIDo = () => getElementByText("Yes, I do");
  getNotYet = () => getElementByText("Not yet");
  getSetupMyLedger = () => getElementByText("Set up my Ledger");
  getConnectYourNano = () => getElementByText("Connect your Nano");
  getContinue = () => getElementByText("Continue");

  // Yes it's a weird character, no do not replace it as it won't find the text
  getPairNano = () => getElementByText("Let’s pair my Nano");

  getPairDeviceButton = () => getElementById("pair-device");
  getNanoDevice = (name = "") => getElementByText(`Nano X de ${name}`);
  getPairWithBluetooth = () => getElementByText("Pair with bluetooth");
  getMaybeLater = () => getElementById("Maybe later");

  async startOnboarding() {
    await tapByElement(this.getOnboardingGetStarted());
  }

  async DoIOwnDevice(answer = true) {
    answer
      ? await tapByElement(this.getYesIDo())
      : await tapByElement(this.getNotYet());
  }

  // change to tap by text
  async chooseToSetupLedger() {
    await tapByElement(this.getSetupMyLedger());
  }

  async selectYourDevice(device: string) {
    await tapByText(device);
  }

  async chooseToConnectYourNano() {
    await tapByElement(this.getConnectYourNano());
  }

  async verifyContentsOfBoxAreChecked() {
    await tapByElement(this.getContinue());
  }

  async chooseToPairMyNano() {
    await tapByElement(this.getPairNano());
  }

  async selectPairWithBluetooth() {
    // await tapByElement(this.getPairWithBluetooth());
    await tapByElement(this.getPairDeviceButton());
  }

  bridgeAddDevices() {
    bridge.addDevices();
  }

  async addDeviceViaBluetooth(name = "David") {
    await tapByElement(this.getNanoDevice(name));

    bridge.setInstalledApps(); // tell LLM what apps the mock device has

    bridge.open(); // open ledger manager

    // Continue to welcome screen
    // await waitFor(
    // element(by.text("Device authentication check")),
    // ).not.toBeVisible();
    // issue here: the 'Pairing Successful' text is 'visible' before it actually is, so it's failing at the continue step as continue isn't actually visible
    // await waitFor(element(by.text("Pairing Successful"))).toBeVisible();
  }

  async openLedgerLive() {
    await tapByElement(this.getContinue());
  }

  async declineNotifications() {
    await tapByElement(this.getMaybeLater());
  }
}
