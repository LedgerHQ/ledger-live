import { expect } from "detox";
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

  it("selects to access wallet", async () => {
    await onboardingSteps.chooseToAccessYourWallet();
  });

  it("chooses to connect Ledger", async () => {
    await onboardingSteps.chooseToConnectYourLedger();
  });

  it("choses to Pair Nano", async () => {
    await onboardingSteps.chooseToPairMyNano();
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
