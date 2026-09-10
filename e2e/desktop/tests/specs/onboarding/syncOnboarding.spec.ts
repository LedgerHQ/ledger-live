import test, { STAX_DEVICE, LATEST_FIRMWARE } from "tests/fixtures/mockServerDevice";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { addTmsLink, getDescription } from "tests/utils/allureUtils";

test.describe("Sync onboarding (mock server transport)", () => {
  test.use({
    teamOwner: Team.WALLET_XP,
  });

  test.describe("Device on the latest firmware", () => {
    test.use({
      mockServerSession: {
        devices: [{ ...STAX_DEVICE, firmware_version: LATEST_FIRMWARE }],
      },
    });

    test(
      "Stax onboards through to the portfolio",
      {
        tag: ["@Stax", "@onboarding"],
        annotation: { type: "TMS", description: "B2CQA-1866" },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

        await app.onboarding.waitForLaunch();
        await app.onboarding.getStarted();
        await app.portfolio.startConnectDeviceFlow();
        await app.onboarding.selectDevice("stax");

        await app.syncOnboarding.expectCompanionReached("stax");

        await app.syncOnboarding.runGenuineCheck();
        await app.syncOnboarding.expectDeviceGenuine();
        await app.syncOnboarding.expectOsUpToDate();

        await app.syncOnboarding.continueToSetup();
        await app.syncOnboarding.expectNewSeedPath();
        await app.syncOnboarding.skipWalletSync();
        await app.syncOnboarding.expectSetupComplete();
        await app.syncOnboarding.expectOnboardingComplete();

        await app.syncOnboarding.declineFunding();
        await app.syncOnboarding.expectCompletionScreen("stax");

        await app.portfolio.waitForPortfolioEmptyState();
      },
    );
  });

  test.describe("Device on an outdated firmware", () => {
    test.use({ mockServerSession: { devices: [STAX_DEVICE] } });

    test("Stax is offered the OS update", { tag: ["@Stax", "@onboarding"] }, async ({ app }) => {
      await app.onboarding.waitForLaunch();
      await app.onboarding.getStarted();
      await app.portfolio.startConnectDeviceFlow();
      await app.onboarding.selectDevice("stax");

      await app.syncOnboarding.expectCompanionReached("stax");

      await app.syncOnboarding.runGenuineCheck();
      await app.syncOnboarding.expectDeviceGenuine();
      await app.syncOnboarding.expectOsUpdateOffered();
    });
  });
});
