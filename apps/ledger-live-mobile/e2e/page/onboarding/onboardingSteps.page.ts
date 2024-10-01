import {
  tapByElement,
  getElementById,
  waitForElementById,
  tapById,
  scrollToId,
} from "../../helpers";
import { ModelId } from "../../models/devices";
import { expect } from "detox";

export default class OnboardingStepsPage {
  getStartedButtonId = "onboarding-getStarted-button";
  acceptAnalyticsButtonId = "accept-analytics-button";
  exploreWithoutDeviceButtonId = "discoverLive-exploreWithoutADevice";
  readyToScanButtonID = "onboarding-scan-button";
  scanAndImportAccountsPageID = "onboarding-import-accounts-title";
  discoverLiveTitle = (index: number) => `onboarding-discoverLive-${index}-title`;
  onboardingGetStartedButton = () => getElementById(this.getStartedButtonId);
  acceptAnalyticsButton = () => getElementById(this.acceptAnalyticsButtonId);
  accessWalletButton = () => getElementById("onboarding-accessWallet");
  noLedgerYetButton = () => getElementById("onboarding-noLedgerYet");
  exploreAppButton = () => getElementById("onboarding-noLedgerYetModal-explore");
  buyLedgerButton = () => getElementById("onboarding-noLedgerYetModal-buy");
  exploreWithoutDeviceButton = () => getElementById(this.exploreWithoutDeviceButtonId);
  connectLedgerButton = () => getElementById("Existing Wallet | Connect");
  syncWithLedgerLiveDesktop = () => getElementById("Existing Wallet | Sync");
  readyToScanButton = () => getElementById(this.readyToScanButtonID);
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

  async startOnboarding() {
    await waitForElementById(this.getStartedButtonId);
    await tapByElement(this.onboardingGetStartedButton());
    await waitForElementById(new RegExp(`${this.setupLedger}|${this.acceptAnalyticsButtonId}`));
    try {
      await tapByElement(this.acceptAnalyticsButton());
    } catch {
      // Analytics prompt not enabled
    }
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

  async chooseToSyncWithLedgerLiveDesktop() {
    await tapByElement(this.syncWithLedgerLiveDesktop());
  }

  async goesThroughLedgerLiveDesktopScanning() {
    await tapByElement(this.readyToScanButton());
  }

  async waitForScanningPage() {
    await waitForElementById(this.scanAndImportAccountsPageID);
  }

  // Setup new Ledger
  async chooseSetupLedger() {
    await tapById(this.setupLedger);
  }

  async chooseDevice(device: ModelId) {
    await scrollToId(this.selectDevice(device));
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

  async declineNotifications() {
    await tapByElement(this.maybeLaterButton());
  }
}
