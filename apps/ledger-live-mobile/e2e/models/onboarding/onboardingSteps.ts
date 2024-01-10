import {
  tapByText,
  tapByElement,
  getElementById,
  waitForElementById,
  tapById,
  waitForElementByText,
} from "../../helpers";
import * as bridge from "../../bridge/server";
import DeviceAction from "../DeviceAction";
import { ModelId, getUSBDevice } from "../devices";
import { expect } from "detox";

export default class OnboardingSteps {
  getStartedButtonId = "onboarding-getStarted-button";
  devicePairedContinueButtonId = "onboarding-paired-continue";
  exploreWithoutDeviceButtonId = "discoverLive-exploreWithoutADevice";
  discoverLiveTitle = (index: number) => `onboarding-discoverLive-${index}-title`;
  onboardingGetStartedButton = () => getElementById(this.getStartedButtonId);
  accessWalletButton = () => getElementById("onboarding-accessWallet");
  noLedgerYetButton = () => getElementById("onboarding-noLedgerYet");
  exploreAppButton = () => getElementById("onboarding-noLedgerYetModal-explore");
  buyLedgerButton = () => getElementById("onboarding-noLedgerYetModal-buy");
  exploreWithoutDeviceButton = () => getElementById(this.exploreWithoutDeviceButtonId);
  connectLedgerButton = () => getElementById("Existing Wallet | Connect");
  continueButton = () => getElementById(this.devicePairedContinueButtonId);
  pairDeviceButton = () => getElementById("pair-device");
  pairNanoButton = () => getElementById("Onboarding-PairNewNano");
  maybeLaterButton = () => getElementById("notifications-prompt-later");

  setupLedger = "onboarding-setupLedger";
  selectDevice = (device: ModelId) => `onboarding-device-selection-${device}`;
  recoveryPhrase = "onboarding-useCase-recoveryPhrase";
  seedWarning = "onboarding-seed-warning";
  importRecoveryPhraseCta = "onboarding-importRecoveryPhrase-cta";
  importRecoveryPhraseWarning = "onboarding-importRecoveryPhrase-warning";
  stepSetupDeviceCta = "onboarding-importRecoveryPhrase-nextStep";
  pinCodeCta = "onboarding-pinCode-cta";
  pinCodeSwitch = "onboarding-pinCode-switch";
  pinCodeSetupCta = "onboarding-pinCodeSetup-cta";
  existingRecoveryPhraseCta = "onboarding-existingRecoveryPhrase-cta";
  existingRecoveryPhraseSwitch = "onboarding-existingRecoveryPhrase-switch";
  existingRecoveryPhrase1Cta = "onboarding-existingRecoveryPhrase1-cta";
  existingRecoveryPhrase2Cta = "onboarding-existingRecoveryPhrase2-cta";
  deviceNotCompatibleModal = "onboarding-deviceNotCompatible-modal";
  deviceNotCompatibleClose = "onboarding-deviceNotCompatible-close";
  devicePairedContinue = "onboarding-paired-continue";

  newWallet = "onboarding-useCase-newWallet";
  stepNewDeviceTitle = (index: number) => `onboarding-stepNewDevice-title${index}`;
  slideBullet = (index: number) => `slide-bullet-${index}`;
  stepNewDeviceCta = "onboarding-stepNewDevice-cta";
  stepNewDeviceStart = "onboarding-stepSetupDevice-start";
  stepNewDeviceWarning = "onboarding-stepSetupDevice-warning";
  stepNewDeviceSetup = "onboarding-stepSetupDevice-setup";
  recoveryPhraseCta = "onboarding-recoveryPhrase-cta";
  recoveryPhraseSwitch = "onboarding-recoveryPhrase-switch";
  recoveryPhraseNextStep = "onboarding-recoveryPhraseSetup-nextStep";
  recoveryPhraseConfirm = "onboarding-recoveryPhraseSetup-confirm";
  recoveryPhraseDone = "onboarding-hideRecoveryPhrase-done";
  quizzStart = "onboarding-quizz-start";
  quizzSuccessRegex = /onboarding-quizz-.*-success/;
  quizzCta = "onboarding-quizz-cta";
  quizzFinalCta = "onboarding-quizz-final-cta";

  defaultName = "Nano X de David";

  async startOnboarding() {
    await waitForElementById(this.getStartedButtonId);
    await tapByElement(this.onboardingGetStartedButton());
  }

  // Exploring App
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

  async chooseToBuyLedger() {
    await tapByElement(this.buyLedgerButton());
  }

  // Accessing existing Wallet
  async chooseToAccessYourWallet() {
    await tapByElement(this.accessWalletButton());
  }

  async chooseToConnectYourLedger() {
    await tapByElement(this.connectLedgerButton());
  }

  // Setup new Ledger
  async chooseSetupLedger() {
    await tapById(this.setupLedger);
  }

  async chooseDevice(device: ModelId) {
    await tapById(this.selectDevice(device));
  }

  async checkDeviceNotCompatible() {
    await expect(getElementById(this.deviceNotCompatibleModal)).toBeVisible();
    await tapById(this.deviceNotCompatibleClose);
  }

  async goesThroughRestorePhrase() {
    await tapById(this.recoveryPhrase);
    await tapById(this.seedWarning);
    await tapById(this.importRecoveryPhraseCta);
    await tapById(this.importRecoveryPhraseWarning);
    await tapById(this.stepSetupDeviceCta);
    await tapById(this.pinCodeCta); //Button disabled : should do nothing
    await tapById(this.pinCodeSwitch);
    await tapById(this.pinCodeCta); //Button enabled
    await tapById(this.pinCodeSetupCta);
    await tapById(this.existingRecoveryPhraseCta); //Check button disabled
    await tapById(this.existingRecoveryPhraseSwitch);
    await tapById(this.existingRecoveryPhraseCta); //Button enabled
    await tapById(this.existingRecoveryPhrase1Cta);
    await tapById(this.existingRecoveryPhrase2Cta);
  }

  async goesThroughCreateWallet() {
    await tapById(this.newWallet);
    await expect(getElementById(this.stepNewDeviceTitle(0))).toBeVisible();
    for (let i = 1; i < 5; i++) {
      await tapById(this.slideBullet(i));
      await expect(getElementById(this.stepNewDeviceTitle(i))).toBeVisible();
    }
    await tapById(this.stepNewDeviceCta);
    await tapById(this.stepNewDeviceStart);
    await tapById(this.stepNewDeviceWarning);
    await tapById(this.stepNewDeviceSetup);
    await tapById(this.pinCodeCta); //Button disabled : should do nothing
    await tapById(this.pinCodeSwitch);
    await tapById(this.pinCodeCta); //Button enabled
    await tapById(this.pinCodeSetupCta);
    await tapById(this.recoveryPhraseCta); //Button disabled : should do nothing
    await tapById(this.recoveryPhraseSwitch);
    await tapById(this.recoveryPhraseCta); //Button enabled
    await tapById(this.recoveryPhraseNextStep);
    await tapById(this.recoveryPhraseConfirm);
    await tapById(this.recoveryPhraseDone);
    await tapById(this.quizzStart);
    for (let i = 0; i < 3; i++) {
      await tapById(this.quizzSuccessRegex);
      await tapById(this.quizzCta);
    }
    await tapById(this.quizzFinalCta);
  }

  async selectPairMyNano() {
    await tapByElement(this.pairNanoButton());
  }

  async addDeviceViaBluetooth(name = this.defaultName) {
    await tapByElement(this.pairDeviceButton());
    bridge.addDevicesBT(name);
    await waitForElementByText(name);
    await tapByText(name);
    bridge.setInstalledApps(); // tell LLM what apps the mock device has
    bridge.open(); // Mocked action open ledger manager on the Nano
    await waitForElementById(this.devicePairedContinue);
  }

  async addDeviceViaUSB(device: ModelId) {
    const nano = getUSBDevice(device);
    bridge.addDevicesUSB(nano);
    await waitForElementByText(nano.deviceName);
    await tapByText(nano.deviceName);
    await new DeviceAction(nano).accessManager();
  }

  async openLedgerLive() {
    await waitForElementById(this.devicePairedContinueButtonId);
    await tapByElement(this.continueButton());
  }

  async declineNotifications() {
    await tapByElement(this.maybeLaterButton());
  }
}
