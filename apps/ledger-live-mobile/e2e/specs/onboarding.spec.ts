import { device, expect } from "detox";
import OnboardingSteps from "../models/onboarding/onboardingSteps";
import PortfolioPage from "../models/wallet/portfolioPage";
import { isAndroid } from "../helpers";
import { launchApp } from "../setup";

let onboardingSteps: OnboardingSteps;
let portfolioPage: PortfolioPage;
let isFirstTest = true;

describe("Onboarding", () => {
  beforeAll(() => {
    onboardingSteps = new OnboardingSteps();
    portfolioPage = new PortfolioPage();
  });

  beforeEach(async () => {
    if (!isFirstTest) {
      await device.uninstallApp();
      await device.installApp();
      await launchApp();
    } else isFirstTest = false;
  });

  it("does the Onboarding and choose to access wallet", async () => {
    await onboardingSteps.startOnboarding();
    await onboardingSteps.chooseToAccessYourWallet();
    await onboardingSteps.chooseToConnectYourLedger();
    await onboardingSteps.selectPairMyNano();
    await onboardingSteps.addDeviceViaBluetooth();
    await onboardingSteps.openLedgerLive();
    await portfolioPage.waitForPortfolioPageToLoad();
    await expect(portfolioPage.portfolioSettingsButton()).toBeVisible();
    //should see an empty portfolio page
    await expect(portfolioPage.emptyPortfolioComponent()).toBeVisible();
  });

  it("does the Onboarding and choose to restore a Nano X", async () => {
    await onboardingSteps.startOnboarding();
    await onboardingSteps.chooseSetupLedger();
    await onboardingSteps.chooseDevice("nanoX");
    await onboardingSteps.goesThroughRestorePhrase();
    await onboardingSteps.selectPairMyNano();
    await onboardingSteps.addDeviceViaBluetooth();
    await onboardingSteps.openLedgerLive();
    await portfolioPage.waitForPortfolioPageToLoad();
    await expect(portfolioPage.portfolioSettingsButton()).toBeVisible();
    await expect(portfolioPage.emptyPortfolioComponent()).toBeVisible();
  });

  it("does the Onboarding and choose to restore a Nano SP", async () => {
    await onboardingSteps.startOnboarding();
    await onboardingSteps.chooseSetupLedger();
    await onboardingSteps.chooseDevice("nanoSP");
    if (!isAndroid()) {
      await onboardingSteps.checkDeviceNotCompatible();
      await onboardingSteps.chooseDevice("nanoS");
      await onboardingSteps.checkDeviceNotCompatible();
    } else {
      await onboardingSteps.goesThroughRestorePhrase();
      await onboardingSteps.selectPairMyNano();
      await onboardingSteps.addDeviceViaUSB("nanoSP");
      await portfolioPage.waitForPortfolioPageToLoad();
    }
  });

  it("does the Onboarding and choose to setup a new Nano X", async () => {
    await onboardingSteps.startOnboarding();
    await onboardingSteps.chooseSetupLedger();
    await onboardingSteps.chooseDevice("nanoX");
    await onboardingSteps.goesThroughCreateWallet();
    await onboardingSteps.selectPairMyNano();
    await onboardingSteps.addDeviceViaBluetooth();
    await onboardingSteps.openLedgerLive();
    await portfolioPage.waitForPortfolioPageToLoad();
  });
});
