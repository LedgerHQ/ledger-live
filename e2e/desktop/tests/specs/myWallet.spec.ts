import { test } from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-common/e2e/enum/Team";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import { LWD_WALLET_40_Q2_FF_ENABLED } from "tests/utils/featureFlagUtils";

test.describe("Wallet 4.0 - My Wallet", () => {
  test.use({
    teamOwner: Team.WALLET_XP,
    userdata: "skip-onboarding",
    featureFlags: {
      ...LWD_WALLET_40_Q2_FF_ENABLED,
      protectServicesDesktop: { enabled: true },
      referralProgramDesktopSidebar: {
        enabled: true,
        params: { path: "/refer-a-friend" },
      },
    },
  });

  test(
    "Open My Wallet and navigate to key sections",
    {
      tag: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
      annotation: {
        type: "TMS",
        description: "B2CQA-5405, B2CQA-5424, B2CQA-5425, B2CQA-5426, B2CQA-5427",
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.mainNavigation.openTargetFromMainNavigation("home");

      await app.myWallet.openMyWalletPopover();

      await app.myWallet.clickRecoverTile();
      await app.myWallet.expectRecoverDiscoveryModalDisplayed();
      await app.myWallet.closeRecoverDiscoveryModal();

      await app.mainNavigation.openTargetFromMainNavigation("home");

      await app.myWallet.openMyWalletPopover();
      await app.myWallet.clickReferralTile();
      await app.myWallet.expectReferralLiveAppLoaded();

      await app.mainNavigation.openTargetFromMainNavigation("home");

      await app.myWallet.openMyWalletPopover();
      await app.myWallet.clickHelpTile();
      await app.myWallet.expectHelpSectionDisplayed();

      await app.mainNavigation.openTargetFromMainNavigation("home");

      await app.myWallet.openMyWalletPopover();
      await app.myWallet.clickSettingsFromPopover();
      await app.myWallet.expectSettingsPageDisplayed();
    },
  );
});
