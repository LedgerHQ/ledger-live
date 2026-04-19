import { onboardingReinstallBeforeEach } from "./onboardingReinstallBeforeEach";

describe("Onboarding - setup new Nano X", () => {
  onboardingReinstallBeforeEach();

  $TmsLink("B2CQA-1799");
  it("does the Onboarding and choose to setup a new Nano X", async () => {
    await app.onboarding.startOnboarding();
    await app.onboarding.chooseSetupLedger();
    await app.onboarding.chooseDevice("nanoX");
    await app.onboarding.goesThroughCreateWallet();
    await app.common.selectAddDevice();
    await app.common.addDeviceViaBluetooth();
    await app.postOnboarding.passThroughPostOnboarding();
    await app.portfolio.waitForPortfolioPageToLoad();
  });
});
