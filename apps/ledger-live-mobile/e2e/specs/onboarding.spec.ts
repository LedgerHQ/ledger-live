import { expect } from "detox";
import { waitForElementByText } from "../helpers";
import OnboardingSteps from "../models/onboarding/onboardingSteps";
import PortfolioPage from "../models/wallet/portfolioPage";

let onboardingSteps: OnboardingSteps;
let portfolioPage: PortfolioPage;

describe("Onboarding", () => {
  beforeAll(() => {
    onboardingSteps = new OnboardingSteps();
    portfolioPage = new PortfolioPage();
  });

  it("starts Onboarding", async () => {
    await onboardingSteps.startOnboarding();
  });

  it("selects already owned nano", async () => {
    await onboardingSteps.DoIOwnDevice(true);
  });

  it("goes to setup my ledger nano", async () => {
    await onboardingSteps.chooseToSetupLedger();
    await waitForElementByText("Ledger\u00A0Nano\u00A0X");
  });

  it("chooses Nano X", async () => {
    await onboardingSteps.selectYourDevice("Ledger\u00A0Nano\u00A0X");
  });

  it("connects to Nano X", async () => {
    await onboardingSteps.chooseToConnectYourNano();
    await onboardingSteps.verifyContentsOfBoxAreChecked();
  });

  it("choses to Pair Nano", async () => {
    await onboardingSteps.chooseToPairMyNano();
  });

  it("selects Pair with Bluetooth", async () => {
    await onboardingSteps.selectPairWithBluetooth();
  });

  it("adds device via Bluetooth", async () => {
    await onboardingSteps.addDeviceViaBluetooth("David");
  });

  it("opens Ledger Live", async () => {
    await onboardingSteps.openLedgerLive();
    await portfolioPage.waitForPortfolioPageToLoad();
    await expect(portfolioPage.portfolioSettingsButton()).toBeVisible();
  });

  it("should see an empty portfolio page", async () => {
    await expect(portfolioPage.emptyPortfolioComponent()).toBeVisible();
  });
});
