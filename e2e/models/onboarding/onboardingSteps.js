import * as bridge from "../../bridge/server";
import * as testHelpers from "../../helpers";

export default class OnboardingSteps {
  static async waitForPageToBeVisible() {
    await testHelpers.waitForElementByText("Get started");
  }

  static async startOnboarding() {
    await testHelpers.tapByText("Get started");
  }

  // change to tap by text
  static async chooseToSetupLedger() {
    await testHelpers.tapByText("SET UP MY LEDGER");
    // await testHelpers.tap("Onboarding PostWelcome - Selection|SetupLedger");
  }

  static async selectYourDevice(device) {
    await testHelpers.tapByText(device);
    // await testHelpers.tap(`Onboarding Device - Selection|${device}`);
  }

  static async chooseToConnectYourNano() {
    await testHelpers.tapByText("Connect your Nano");
  }

  static async verifyContentsOfBoxAreChecked() {
    await testHelpers.tapByText("Continue");
  }

  static async chooseToPairMyNano() {
    await testHelpers.tapByText("Let’s pair my Nano");
  }

  static async selectPairWithBluetooth() {
    await testHelpers.tapByText("Pair with bluetooth");
  }

  static async addDeviceViaBluetooth() {
    bridge.addDevices();
    await testHelpers.delay(1000); // give time for devices to appear
    await testHelpers.tapByText("Nano X de David");

    bridge.setInstalledApps(); // tell LLM what apps the mock device has

    bridge.open(); // open ledger manager

    // Continue to welcome screen
    // await waitFor(
    // element(by.text("Device authentication check")),
    // ).not.toBeVisible();
    // issue here: the 'Pairing Successful' text is 'visible' before it actually is, so it's failing at the continue step as continue isn't actually visible
    // await waitFor(element(by.text("Pairing Successful"))).toBeVisible();

    await testHelpers.delay(5000); // wait for flaky 'device authentication check screen'
  }

  static async openLedgerLive() {
    await testHelpers.tapByText("Continue");
  }
}
