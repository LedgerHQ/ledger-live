import { test } from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { AppInfos } from "@ledgerhq/live-e2e-shared/enum/AppInfos";
import { liveDataCommand } from "@ledgerhq/live-e2e-shared/cliCommandsUtils";
import { FF_PERPS_DESKTOP, IS_PERPS_LIVE_APP_STAGING } from "tests/utils/featureFlagUtils";
import { buildTags } from "tests/utils/tagsUtils";
import { getPerpsLiveAppStorage } from "tests/utils/perpsLiveAppStorage";
import { exclusiveLockFor } from "tests/utils/exclusiveLock";
import { HIP3_MARKETS } from "tests/utils/perpsMarkets";
import {
  closePerpsPositionsOpenedByTest,
  openPerpsFromPortfolio,
  readPerpsPositions,
  ORDER_LEVERAGE,
  ORDER_MARGIN_USD,
  PERPS_REAL_BROADCAST_ENV,
} from "tests/utils/perpsPositionFlows";
import { skipSharedAccountOnSecondaryLeg } from "tests/utils/sharedAccountUtils";
import type { PerpsOrderSide, ProviderPosition } from "tests/page/perps.order.page";

const account = Account.HYPERCORE_1;
const market = HIP3_MARKETS;
const lock = exclusiveLockFor({ broadcastAccounts: [account] }, PERPS_REAL_BROADCAST_ENV);

const orders = [
  { side: "long", xrayTicket: "B2CQA-4699" },
  { side: "short", xrayTicket: "B2CQA-4700" },
] satisfies { side: PerpsOrderSide; xrayTicket: string }[];

test.describe("Perps open position", { lock: lock.names }, () => {
  // Remove once the Perps feature flags are on PRD.
  test.skip(!IS_PERPS_LIVE_APP_STAGING, "Perps feature flags are not on PRD yet");
  skipSharedAccountOnSecondaryLeg("Perps open", PERPS_REAL_BROADCAST_ENV);

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

  // Unset until the provider is read, so a failed setup never closes a position it did not open.
  let positionsAtStart: ProviderPosition[] | undefined;

  test.beforeEach(async ({ app, userdataFile }) => {
    positionsAtStart = undefined;
    await openPerpsFromPortfolio(app);
    positionsAtStart = await readPerpsPositions(app, { account, userdataFile });
  });

  // The position is a real one, so it is closed even when the test fails.
  test.afterEach(async ({ app, speculos, userdataFile }) => {
    if (!positionsAtStart) return;
    await closePerpsPositionsOpenedByTest(app, {
      account,
      userdataFile,
      positionsAtStart,
      relaunchSpeculos: speculos.relaunch,
    });
  });

  for (const { side, xrayTicket } of orders) {
    test(
      `Open a ${market.label} ${side} position with margin, take profit and stop loss`,
      {
        tag: buildTags({ currencyId: account.currency.id, skipLNS: true }),
        annotation: { type: "TMS", description: xrayTicket },
      },
      async ({ app, speculos }) => {
        await app.perpsOrder.openFirstMarketWithoutPosition(market, positionsAtStart ?? []);
        // The order form opens on Long.
        if (side === "short") await app.perpsOrder.selectSide(side);
        await app.perpsOrder.setLeverage(ORDER_LEVERAGE);
        await app.perpsOrder.expectLeverage(ORDER_LEVERAGE);
        await app.perpsOrder.enterMargin(ORDER_MARGIN_USD);
        await app.perpsOrder.setAutoClose(side);
        await app.perpsOrder.expectAutoCloseSet();
        await speculos.relaunch(AppInfos.HYPERLIQUID.name);
        await app.perpsOrder.clickOpenPosition();
        await app.speculos.signHyperliquidMessage();
        await app.perpsOrder.expectOrderPlaced();
        await app.perpsOrder.clickContinueAfterOrderPlaced();
        await app.perpsOrder.expectOpenedPosition({
          side,
          leverage: ORDER_LEVERAGE,
          marginUsd: ORDER_MARGIN_USD,
        });
      },
    );
  }
});
