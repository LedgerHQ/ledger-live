import { test } from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { DEVICE_TAGS } from "tests/utils/tagsUtils";
import { FF_ANALYTICS_OPT_IN_SCREEN_V2 } from "tests/utils/featureFlagUtils";
import { FRESH_INSTALL_SETTINGS } from "tests/utils/userdata";

test.describe("User opens the application after installation", () => {
  test.use({
    teamOwner: Team.ENGAGEMENT,
    settings: FRESH_INSTALL_SETTINGS,
    featureFlags: FF_ANALYTICS_OPT_IN_SCREEN_V2,
  });

  test(
    "Get started lands on an empty Wallet without a device",
    {
      tag: ["@onboarding", ...DEVICE_TAGS],
      annotation: { type: "TMS", description: "B2CQA-508" },
    },
    async ({ app }) => {
      await app.onboarding.waitForLaunch();
      await app.onboarding.getStarted();
      await app.onboarding.acceptAnalytics();

      await app.portfolio.expectNoDeviceWalletHome();
      await app.portfolio.expectNoDeviceHeader();
      await app.portfolio.expectNoDeviceQuickActions();

      await app.portfolio.cryptoAddressesBanner.expectNoAccounts();
      await app.mainNavigation.expectTargetDisabled("accounts");
      await app.layout.expectSyncButtonHidden();

      await app.mainNavigation.openSettings();
      await app.settings.expectSettingsPageVisible();
      await app.mainNavigation.openTargetFromMainNavigation("home");
      await app.portfolio.expectNoDeviceWalletHome();

      await app.marketBanner.clickExploreMarketHeader();
      await app.market.expectMarketPageVisible();
      await app.mainNavigation.openTargetFromMainNavigation("home");
      await app.portfolio.expectNoDeviceWalletHome();

      await app.layout.expectNoRenderError();

      await app.portfolio.startConnectDeviceFlow();
      await app.onboarding.expectDeviceSelectionScreen();
      await app.onboarding.expectDeviceCards();
    },
  );
});
