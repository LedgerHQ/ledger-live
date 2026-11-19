import { test } from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { FF_PERPS_DESKTOP, IS_PERPS_LIVE_APP_STAGING } from "tests/utils/featureFlagUtils";
import { buildTags } from "tests/utils/tagsUtils";
import { getPerpsLiveAppStorage } from "tests/utils/perpsLiveAppStorage";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { liveDataCommand } from "@ledgerhq/live-e2e-shared/cliCommandsUtils";

const account = Account.HYPERCORE_1;

const xrayTicket = "B2CQA-4690";

test.describe("Perps", () => {
  // Remove once the Perps feature flags are on PRD.
  test.skip(!IS_PERPS_LIVE_APP_STAGING, "Perps feature flags are not on PRD yet");

  test.use({
    teamOwner: Team.PERPS,
    userdata: "skip-onboarding",
    speculosApp: account.currency.speculosApp,
    cliCommands: [liveDataCommand(account)],
    webviewLocalStorage: {
      hostnamePrefix: "perps.",
      entries: getPerpsLiveAppStorage(account),
    },
    featureFlags: FF_PERPS_DESKTOP,
  });

  test.beforeEach(async ({ app }) => {
    await app.mainNavigation.openTargetFromMainNavigation("home");
    await app.portfolio.clickPerpsEntryPoint();
  });

  test(
    "Open Perps home - account selected",
    {
      tag: buildTags({ currencyId: account.currency.id, skipLNS: true, extraTags: ["@smoke"] }),
      annotation: { type: "TMS", description: xrayTicket },
    },
    async ({ app }) => {
      await app.perps.expectFundedAccountBalance();
    },
  );
});
