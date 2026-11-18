import { test } from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import {
  FF_LWD_WALLET_40_Q2_NO_ANALYTICS_CONSENT,
  FF_PERPS_DESKTOP,
} from "tests/utils/featureFlagUtils";
import {
  getPerpsLiveAppStorage,
  PERPS_HYPERCORE_ACCOUNT_ID,
} from "tests/utils/perpsLiveAppStorage";

const xrayTicket = "B2CQA-4690";

test.describe("Perps", () => {
  test.use({
    teamOwner: Team.PERPS,
    userdata: "perps-migrated-account",
    webviewLocalStorage: {
      hostnamePrefix: "perps.",
      entries: getPerpsLiveAppStorage(PERPS_HYPERCORE_ACCOUNT_ID),
    },
    featureFlags: {
      ...FF_LWD_WALLET_40_Q2_NO_ANALYTICS_CONSENT,
      ...FF_PERPS_DESKTOP,
    },
  });

  test.beforeEach(async ({ app }) => {
    await app.mainNavigation.openTargetFromMainNavigation("home");
    await app.perps.openFromPortfolio();
  });

  test(
    "Open Perps home - account selected",
    { annotation: { type: "TMS", description: xrayTicket } },
    async ({ app }) => {
      await app.perps.expectHome();
    },
  );
});
