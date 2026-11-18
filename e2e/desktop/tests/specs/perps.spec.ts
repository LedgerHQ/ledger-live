import { test } from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import {
  FF_LWD_WALLET_40_Q2_NO_ANALYTICS_CONSENT,
  FF_PERPS_DESKTOP,
} from "tests/utils/featureFlagUtils";
import { getPerpsLiveAppStorage } from "tests/utils/perpsLiveAppStorage";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { liveDataCommand } from "@ledgerhq/live-e2e-shared/cliCommandsUtils";

const account = Account.HYPERCORE_1;

const xrayTicket = "B2CQA-4690";

test.describe("Perps", () => {
  test.use({
    teamOwner: Team.PERPS,
    userdata: "skip-onboarding",
    speculosApp: account.currency.speculosApp,
    cliCommands: [liveDataCommand(account, { currency: account.currency.id })],
    webviewLocalStorage: {
      hostnamePrefix: "perps.",
      entries: getPerpsLiveAppStorage(account),
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
