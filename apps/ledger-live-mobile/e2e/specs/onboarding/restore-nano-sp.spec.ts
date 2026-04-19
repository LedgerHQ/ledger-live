import { isAndroid } from "../../helpers/commonHelpers";
import { onboardingReinstallBeforeEach } from "./onboardingReinstallBeforeEach";

describe("Onboarding - restore Nano SP", () => {
  onboardingReinstallBeforeEach();

  $TmsLink("B2CQA-1800");
  $TmsLink("B2CQA-1833");
  it("does the Onboarding and choose to restore a Nano SP", async () => {
    await app.onboarding.startOnboarding();
    await app.onboarding.chooseSetupLedger();
    await app.onboarding.chooseDevice("nanoSP");
    if (!isAndroid()) {
      await app.onboarding.checkDeviceNotCompatible();
      await app.onboarding.chooseDevice("nanoS");
      await app.onboarding.checkDeviceNotCompatible();
    } else {
      await app.onboarding.goesThroughRestorePhrase();
      await app.common.addDeviceViaUSB("nanoSP");
      await app.postOnboarding.passThroughPostOnboarding();
      await app.portfolio.waitForPortfolioPageToLoad();
    }
  });
});
