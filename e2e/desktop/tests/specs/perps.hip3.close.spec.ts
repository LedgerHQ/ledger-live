import { test } from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { AppInfos } from "@ledgerhq/live-e2e-shared/enum/AppInfos";
import { liveDataCommand } from "@ledgerhq/live-e2e-shared/cliCommandsUtils";
import { FF_PERPS_DESKTOP, IS_PERPS_LIVE_APP_STAGING } from "tests/utils/featureFlagUtils";
import { buildTags } from "tests/utils/tagsUtils";
import { getPerpsLiveAppStorage } from "tests/utils/perpsLiveAppStorage";
import { exclusiveLockFor } from "tests/utils/exclusiveLock";
import type { ProviderPosition } from "tests/page/perps.order.page";
import {
  closeHip3Position,
  closeHip3PositionsOpenedByTest,
  openHip3Position,
  openPerpsFromPortfolio,
  readHip3Positions,
  PERPS_REAL_BROADCAST_ENV,
} from "tests/utils/perpsPositionFlows";

const account = Account.HYPERCORE_1;
const lock = exclusiveLockFor({ broadcastAccounts: [account] }, PERPS_REAL_BROADCAST_ENV);

const xrayTicket = "B2CQA-4707";

test.describe("Perps HIP-3 close position", { lock: lock.names }, () => {
  // Remove once the Perps feature flags are on PRD.
  test.skip(!IS_PERPS_LIVE_APP_STAGING, "Perps feature flags are not on PRD yet");

  test.use(lock.fixtures);
  test.use({
    teamOwner: Team.PERPS,
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: AppInfos.ETHEREUM,
    cliCommands: [liveDataCommand(account)],
    webviewLocalStorage: {
      hostnamePrefix: "perps.",
      entries: getPerpsLiveAppStorage(account, { hip3: true }),
    },
    featureFlags: FF_PERPS_DESKTOP,
    env: PERPS_REAL_BROADCAST_ENV,
  });

  // Unset until the provider is read, so a failed setup never closes a position it did not open.
  let positionsAtStart: ProviderPosition[] | undefined;

  test.beforeEach(async ({ app, speculos, userdataFile }) => {
    positionsAtStart = undefined;
    await openPerpsFromPortfolio(app);
    positionsAtStart = await readHip3Positions(app, { account, userdataFile });
    await openHip3Position(app, {
      side: "long",
      positions: positionsAtStart,
      relaunchSpeculos: speculos.relaunch,
    });
  });

  // Keeps the real position from staying open if the close fails.
  test.afterEach(async ({ app, speculos, userdataFile }) => {
    if (!positionsAtStart) return;
    await closeHip3PositionsOpenedByTest(app, {
      account,
      userdataFile,
      positionsAtStart,
      relaunchSpeculos: speculos.relaunch,
    });
  });

  test(
    "Close a HIP-3 position",
    {
      tag: buildTags({ currencyId: account.currency.id, skipLNS: true }),
      annotation: { type: "TMS", description: xrayTicket },
    },
    async ({ app, speculos }) => {
      await closeHip3Position(app, { relaunchSpeculos: speculos.relaunch });
    },
  );
});
