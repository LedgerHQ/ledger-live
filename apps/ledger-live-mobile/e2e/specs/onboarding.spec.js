import OnboardingSteps from "../models/onboarding/onboardingSteps";
import PortfolioPage from "../models/portfolioPage";

describe("Onboarding", () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it("should be able to connect a Nano X", async () => {
    await OnboardingSteps.waitForPageToBeVisible();
    await OnboardingSteps.startOnboarding();
    await OnboardingSteps.chooseToSetupLedger();
    await OnboardingSteps.selectYourDevice("NANO X");
    await OnboardingSteps.chooseToConnectYourNano();
    await OnboardingSteps.verifyContentsOfBoxAreChecked();
    await OnboardingSteps.chooseToPairMyNano();
    await OnboardingSteps.selectPairWithBluetooth();
    await OnboardingSteps.addDeviceViaBluetooth();
    await OnboardingSteps.openLedgerLive();

    await PortfolioPage.waitForPageToBeVisible();
    await PortfolioPage.emptyPortfolioIsVisible();
  });
});
