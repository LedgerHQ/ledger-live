import { test } from "tests/fixtures/common";
import { staxDevice } from "tests/utils/mockServerUtils";
import { FF_LWD_WALLET_40_Q2 } from "tests/utils/featureFlagUtils";

const DEVICE_NAME = "Ledger Stax";

/**
 * The onboarding software check, run off two mock server devices that differ
 * only in their genuine verdict, so a passing and a failing check can be
 * compared.
 */
test.describe("Onboarding genuine check", () => {
  test.use({
    featureFlags: {
      ldmkTransport: { enabled: true },
      // Lazy onboarding skips straight to the portfolio, so the device
      // selection and the software check it leads to are only reachable with it
      // off.
      lwdWallet40: {
        ...FF_LWD_WALLET_40_Q2.lwdWallet40,
        params: { ...FF_LWD_WALLET_40_Q2.lwdWallet40.params, lazyOnboarding: false },
      },
    },
  });

  test.describe("genuine device", () => {
    test.use({ mockServerDevice: staxDevice({ genuine: true }) });

    test("[Stax] Genuine check passes", { tag: ["@Stax"] }, async ({ app }) => {
      await app.onboarding.waitForLaunch();
      await app.onboarding.clickGetStartedButton();
      await app.onboarding.selectDevice("stax");
      await app.onboarding.startSoftwareCheck();
      await app.onboarding.expectGenuineCheckToPass(DEVICE_NAME);
    });
  });

  test.describe("not genuine device", () => {
    test.use({ mockServerDevice: staxDevice({ genuine: false }) });

    test(
      "[Stax] Genuine check reports the device as not genuine",
      { tag: ["@Stax"] },
      async ({ app }) => {
        await app.onboarding.waitForLaunch();
        await app.onboarding.clickGetStartedButton();
        await app.onboarding.selectDevice("stax");
        await app.onboarding.startSoftwareCheck();
        await app.onboarding.expectGenuineCheckToFail(DEVICE_NAME);
      },
    );
  });
});
