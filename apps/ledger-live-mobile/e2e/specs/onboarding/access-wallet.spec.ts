import { onboardingReinstallBeforeEach } from "./onboardingReinstallBeforeEach";

describe("Onboarding - access wallet", () => {
  onboardingReinstallBeforeEach();

  $TmsLink("B2CQA-1803");
  it("does the Onboarding and choose to access wallet", async () => {
    await app.onboarding.startOnboarding();
    await app.onboarding.chooseToAccessYourWallet();
    await app.onboarding.chooseToConnectYourLedger();
    await app.common.selectAddDevice();
    await app.common.addDeviceViaBluetooth();
    await app.portfolio.waitForPortfolioPageToLoad();
    await app.portfolio.expectPortfolioEmpty();
  });
});
