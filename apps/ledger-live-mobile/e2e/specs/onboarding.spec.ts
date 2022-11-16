import OnboardingSteps from "../models/onboarding/onboardingSteps";
import PortfolioPage from "../models/portfolioPage";

describe("Onboarding", () => {
  it("should be able to connect a Nano X", async () => {
    await OnboardingSteps.waitForPageToBeVisible();
    await OnboardingSteps.startOnboarding();
    await OnboardingSteps.DoIOwnDevice(true);
    await OnboardingSteps.chooseToSetupLedger();
    await OnboardingSteps.selectYourDevice("Ledger\u00A0Nano\u00A0X");
    await OnboardingSteps.chooseToConnectYourNano();
    await OnboardingSteps.verifyContentsOfBoxAreChecked();
    await OnboardingSteps.chooseToPairMyNano();
    await OnboardingSteps.selectPairWithBluetooth();
    await OnboardingSteps.addDeviceViaBluetooth();
    await OnboardingSteps.openLedgerLive();
    await OnboardingSteps.declineNotifications();

    await PortfolioPage.waitForPageToBeVisible();
    await PortfolioPage.emptyPortfolioIsVisible();
  });
});
