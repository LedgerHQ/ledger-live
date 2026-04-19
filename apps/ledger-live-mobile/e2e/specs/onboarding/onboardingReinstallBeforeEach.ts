import { device } from "detox";
import { launchApp } from "../../helpers/commonHelpers";

/**
 * Reinstalls the app between tests in this suite (skipped on the first test).
 */
export function onboardingReinstallBeforeEach(): void {
  let isFirstTest = true;
  beforeEach(async () => {
    if (!isFirstTest) {
      await device.uninstallApp();
      await device.installApp();
      await launchApp();
    } else {
      isFirstTest = false;
    }
  });
}
