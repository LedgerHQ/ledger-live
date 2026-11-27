import { test } from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { AppInfos } from "@ledgerhq/live-e2e-shared/enum/AppInfos";
import { liveDataCommand } from "@ledgerhq/live-e2e-shared/cliCommandsUtils";
import { FF_PERPS_DESKTOP, IS_PERPS_LIVE_APP_STAGING } from "tests/utils/featureFlagUtils";
import { buildTags } from "tests/utils/tagsUtils";
import { getPerpsLiveAppStorage } from "tests/utils/perpsLiveAppStorage";
import { exclusiveLockFor } from "tests/utils/exclusiveLock";
import { HIP3_MARKETS, type ProviderPosition } from "tests/utils/perpsMarkets";
import {
  closePerpsLeftovers,
  closePerpsPositionsOpenedByTest,
  openPerpsFromPortfolio,
  openPerpsPositionThroughDriver,
  readPerpsMarketsInUse,
  PERPS_REAL_BROADCAST_ENV,
} from "tests/utils/perpsPositionFlows";
import { skipSharedAccountOnSecondaryLeg } from "tests/utils/sharedAccountUtils";

const account = Account.HYPERCORE_1;
const market = HIP3_MARKETS;
const lock = exclusiveLockFor({ broadcastAccounts: [account] }, PERPS_REAL_BROADCAST_ENV);

const xrayTicket = "B2CQA-4707";

test.describe("Perps close position", { lock: lock.names }, () => {
  // Remove once the Perps feature flags are on PRD.
  test.skip(!IS_PERPS_LIVE_APP_STAGING, "Perps feature flags are not on PRD yet");
  skipSharedAccountOnSecondaryLeg("Perps close", PERPS_REAL_BROADCAST_ENV);

  test.use(lock.fixtures);
  test.use({
    teamOwner: Team.PERPS,
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: AppInfos.ETHEREUM,
    cliCommands: [liveDataCommand(account)],
    webviewLocalStorage: {
      hostnamePrefix: "perps.",
      entries: getPerpsLiveAppStorage(account, { featureFlags: market.liveAppFlags }),
    },
    featureFlags: FF_PERPS_DESKTOP,
    env: PERPS_REAL_BROADCAST_ENV,
  });

  // Unset until read, so cleanup never closes foreign positions.
  let marketsAtStart: ProviderPosition[] | undefined;
  let position: ProviderPosition;

  test.beforeEach(async ({ app, speculos, userdataFile }) => {
    marketsAtStart = undefined;
    await closePerpsLeftovers({
      account,
      userdataFile,
      market,
      restoreApp: AppInfos.ETHEREUM.name,
      relaunchSpeculos: speculos.relaunch,
    });
    marketsAtStart = await readPerpsMarketsInUse({ account, userdataFile });
    position = await openPerpsPositionThroughDriver({
      account,
      userdataFile,
      market,
      side: "long",
      relaunchSpeculos: speculos.relaunch,
    });
    await speculos.relaunch(AppInfos.ETHEREUM.name);
    await openPerpsFromPortfolio(app);
  });

  // Closes the real position if the UI close fails.
  test.afterEach(async ({ speculos, userdataFile }) => {
    if (!marketsAtStart) return;
    await closePerpsPositionsOpenedByTest({
      account,
      userdataFile,
      marketsAtStart,
      relaunchSpeculos: speculos.relaunch,
    });
  });

  test(
    `Close position - ${market.label}`,
    {
      // The Hyperliquid app has no Nano S build.
      tag: buildTags({ currencyId: account.currency.id, skipLNS: true }),
      annotation: { type: "TMS", description: xrayTicket },
    },
    async ({ app, speculos }) => {
      await app.perpsOrder.openPositionFromList(position.symbol);
      await speculos.relaunch(AppInfos.HYPERLIQUID.name);
      await app.perpsOrder.startClosePosition();
      await app.speculos.signHyperliquidMessage();
      await app.perpsOrder.expectCloseRecap();
      await app.perpsOrder.clickTradeAgainOnCloseRecap();
      await app.perpsOrder.expectPositionClosed();
    },
  );
});
