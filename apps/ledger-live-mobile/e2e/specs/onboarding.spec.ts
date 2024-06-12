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

  $TmsLink("B2CQA-1803");
  it("does the Onboarding and choose to access wallet", async () => {
    await onboardingSteps.startOnboarding();
    await onboardingSteps.chooseToAccessYourWallet();
    await onboardingSteps.chooseToConnectYourLedger();
    await onboardingSteps.selectPairMyNano();
    await onboardingSteps.selectAddDevice();
    await onboardingSteps.addDeviceViaBluetooth();
    await portfolioPage.waitForPortfolioPageToLoad();
    await expect(portfolioPage.portfolioSettingsButton()).toBeVisible();
    await expect(portfolioPage.emptyPortfolioList()).toBeVisible();
  });

  $TmsLink("B2CQA-1802");
  it("does the Onboarding and choose to restore a Nano X", async () => {
    await onboardingSteps.startOnboarding();
    await onboardingSteps.chooseSetupLedger();
    await onboardingSteps.chooseDevice("nanoX");
    await onboardingSteps.goesThroughRestorePhrase();
    await onboardingSteps.selectPairMyNano();
    await onboardingSteps.selectAddDevice();
    await onboardingSteps.addDeviceViaBluetooth();
    await portfolioPage.waitForPortfolioPageToLoad();
    await expect(portfolioPage.portfolioSettingsButton()).toBeVisible();
    await expect(portfolioPage.emptyPortfolioList()).toBeVisible();
  });

  $TmsLink("B2CQA-1800");
  $TmsLink("B2CQA-1833");
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

  $TmsLink("B2CQA-1799");
  it("does the Onboarding and choose to setup a new Nano X", async () => {
    await onboardingSteps.startOnboarding();
    await onboardingSteps.chooseSetupLedger();
    await onboardingSteps.chooseDevice("nanoX");
    await onboardingSteps.goesThroughCreateWallet();
    await onboardingSteps.selectPairMyNano();
    await onboardingSteps.selectAddDevice();
    await onboardingSteps.addDeviceViaBluetooth();
    await portfolioPage.waitForPortfolioPageToLoad();
  });

  $TmsLink("B2CQA-1804");
  it("does the Onboarding and choose to synchronize with Ledger Live Desktop", async () => {
    await device.launchApp({ permissions: { camera: "YES" } }); // Make sure permission is given
    await onboardingSteps.startOnboarding();
    await onboardingSteps.chooseToAccessYourWallet();
    await onboardingSteps.chooseToSyncWithLedgerLiveDesktop();
    await onboardingSteps.goesThroughLedgerLiveDesktopScanning();
    await onboardingSteps.waitForScanningPage();
  });
});
