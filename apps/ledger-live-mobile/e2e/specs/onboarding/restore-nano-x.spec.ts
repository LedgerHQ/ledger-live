import { onboardingReinstallBeforeEach } from "./onboardingReinstallBeforeEach";

describe("Onboarding - restore Nano X", () => {
  onboardingReinstallBeforeEach();

  $TmsLink("B2CQA-1802");
  it("does the Onboarding and choose to restore a Nano X", async () => {
    await app.onboarding.startOnboarding();
    await app.onboarding.chooseSetupLedger();
    await app.onboarding.chooseDevice("nanoX");
    await app.onboarding.goesThroughRestorePhrase();
    await app.common.selectAddDevice();
    await app.common.addDeviceViaBluetooth();
    await app.postOnboarding.passThroughPostOnboarding();
    await app.portfolio.waitForPortfolioPageToLoad();
    await app.portfolio.expectPortfolioEmpty();
  });
});
