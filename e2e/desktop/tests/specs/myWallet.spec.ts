import { test } from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { DEVICE_TAGS } from "tests/utils/tagsUtils";

test.describe("My Wallet", () => {
  test.use({
    teamOwner: Team.WALLET_XP,
    userdata: "skip-onboarding",
    featureFlags: {
      protectServicesDesktop: { enabled: true },
      referralProgramDesktopSidebar: {
        enabled: true,
        params: { path: "/refer-a-friend", isNew: true, amount: "$20" },
      },
      lwdBackupHub: { enabled: false },
    },
  });

  test(
    "Open My Wallet and navigate to key sections",
    {
      tag: [...DEVICE_TAGS],
      annotation: {
        type: "TMS",
        description: "B2CQA-5405, B2CQA-5424, B2CQA-5425, B2CQA-5426, B2CQA-5427",
      },
    },
    async ({ app }) => {
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
