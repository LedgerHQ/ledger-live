import { verifyTextIsVisible } from "../helpers";
import OnboardingSteps from "../models/onboarding/onboardingSteps";
import PortfolioPage from "../models/portfolioPage";

describe("Onboarding", () => {
  it("waits for Onboarding page to be ready", async () => {
    await OnboardingSteps.waitForPageToBeVisible();
    await verifyTextIsVisible("Get started");
  });

  it("starts Onboarding", async () => {
    await OnboardingSteps.startOnboarding();
  });

  it("selects already owned nano", async () => {
    await OnboardingSteps.DoIOwnDevice(true);
  });

  it("goes to setup my ledger nano", async () => {
    await OnboardingSteps.chooseToSetupLedger();
    await verifyTextIsVisible("Ledger\u00A0Nano\u00A0X");
  });

  it("choses Nano X", async () => {
    await OnboardingSteps.selectYourDevice("Ledger\u00A0Nano\u00A0X");
  });

  it("connects to Nano X", async () => {
    await OnboardingSteps.chooseToConnectYourNano();
    await OnboardingSteps.verifyContentsOfBoxAreChecked();
  });

  it("choses to Pair Nano", async () => {
    await OnboardingSteps.chooseToPairMyNano();
  });

  it("selects Pair with Bluetooth", async () => {
    await OnboardingSteps.selectPairWithBluetooth();
  });

  it("adds device via Bluetooth", async () => {
    await OnboardingSteps.addDeviceViaBluetooth();
  });

  it("opens Ledger Live", async () => {
    await OnboardingSteps.openLedgerLive();
    // await OnboardingSteps.declineNotifications();
  });

  it("should see an empty portfolio page", async () => {
    await PortfolioPage.waitForPageToBeVisible();
    await PortfolioPage.emptyPortfolioIsVisible();
  });
});
