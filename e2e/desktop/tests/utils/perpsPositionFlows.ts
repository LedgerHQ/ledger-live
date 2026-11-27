import { AppInfos } from "@ledgerhq/live-e2e-shared/enum/AppInfos";
import { closePerpsMarkets } from "@ledgerhq/live-e2e-shared/perps/perpsFlow";
import { PerpsApi } from "@ledgerhq/live-e2e-shared/perps/perpsApi";
import type { SpeculosDevice } from "@ledgerhq/live-e2e-shared/speculos";
import type { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import type { Application } from "tests/page";
import { getSavedAccountAddress } from "tests/utils/userdata";
import type { PerpsMarketGroup, PerpsOrderSide, ProviderPosition } from "tests/utils/perpsMarkets";

// Real broadcast, overriding any host value.
export const PERPS_REAL_BROADCAST_ENV = { DISABLE_TRANSACTION_BROADCAST: "0" };

// Notional of 15 USD passes the live app's order minimum.
export const ORDER_MARGIN_USD = 5;
export const ORDER_LEVERAGE = 3;

type RelaunchSpeculos = (appName: string) => Promise<SpeculosDevice>;

export async function openPerpsFromPortfolio(app: Application) {
  await app.portfolio.clickPerpsEntryPoint();
  await app.perps.expectFundedAccountBalance();
}

export async function openPerpsPosition(
  app: Application,
  {
    market,
    side,
    positions,
    relaunchSpeculos,
    marginUsd = ORDER_MARGIN_USD,
    leverage = ORDER_LEVERAGE,
  }: {
    market: PerpsMarketGroup;
    side: PerpsOrderSide;
    positions: ProviderPosition[];
    relaunchSpeculos: RelaunchSpeculos;
    marginUsd?: number;
    leverage?: number;
  },
) {
  await app.perpsOrder.openFirstMarketWithoutPosition(market, positions);
  // The order form opens on Long.
  if (side === "short") await app.perpsOrder.selectSide(side);
  await app.perpsOrder.setLeverage(leverage);
  await app.perpsOrder.expectLeverage(leverage);
  await app.perpsOrder.enterMargin(marginUsd);
  await app.perpsOrder.setAutoClose(side);
  await app.perpsOrder.expectAutoCloseSet();
  await relaunchSpeculos(AppInfos.HYPERLIQUID.name);
  await app.perpsOrder.clickOpenPosition();
  await app.speculos.signHyperliquidMessage();
  await app.perpsOrder.expectOrderPlaced();
  await app.perpsOrder.clickContinueAfterOrderPlaced();
  await app.perpsOrder.expectOpenedPosition({ side, leverage, marginUsd });
}

export async function closePerpsPosition(
  app: Application,
  { relaunchSpeculos }: { relaunchSpeculos: RelaunchSpeculos },
) {
  await relaunchSpeculos(AppInfos.HYPERLIQUID.name);
  await app.perpsOrder.startClosePosition();
  await app.speculos.signHyperliquidMessage();
  await app.perpsOrder.expectCloseRecap();
  await app.perpsOrder.clickTradeAgainOnCloseRecap();
  await app.perpsOrder.expectPositionClosed();
}

type PerpsAccount = { account: Account; userdataFile: string };

// Reads the Perps API, so a broken webview cannot block.
export async function readPerpsPositions({
  account,
  userdataFile,
}: PerpsAccount): Promise<ProviderPosition[]> {
  const api = new PerpsApi();
  const address = await getSavedAccountAddress(userdataFile, account);
  const positions = await api.getPositions(address);
  return Promise.all(
    positions.map(async ({ marketId }) => ({
      marketId,
      symbol: await api.getMarketSymbol(marketId),
    })),
  );
}

const CLEANUP_ATTEMPTS = 2;

type CleanupOptions = PerpsAccount & { relaunchSpeculos: RelaunchSpeculos };

// Retries with a fresh Speculos, then checks the API independently.
async function closePerpsMarketsMatching(
  { account, userdataFile, relaunchSpeculos }: CleanupOptions,
  isTarget: (marketId: string) => boolean,
): Promise<boolean> {
  const api = new PerpsApi();
  const address = await getSavedAccountAddress(userdataFile, account);
  const targets = async () =>
    (await api.getPositions(address)).map(({ marketId }) => marketId).filter(isTarget);
  let closed = false;
  let lastError: unknown;
  for (let attempt = 1; attempt <= CLEANUP_ATTEMPTS; attempt++) {
    const marketIds = await targets();
    if (marketIds.length === 0) break;
    closed = true;
    try {
      const device = await relaunchSpeculos(AppInfos.HYPERLIQUID.name);
      await closePerpsMarkets({
        address,
        marketIds,
        speculosApiPort: device.port,
        derivationPath: account.accountPath,
      });
    } catch (error) {
      lastError = error;
      console.warn(`Perps cleanup attempt ${attempt} failed: ${String(error)}`);
    }
  }
  const left = await targets();
  if (left.length > 0) {
    throw new Error(`Perps positions still open on ${left.join(", ")}`, { cause: lastError });
  }
  return closed;
}

// Under the account lock, any group position is a leftover.
export async function closePerpsLeftovers({
  market,
  restoreApp,
  ...options
}: CleanupOptions & { market: PerpsMarketGroup; restoreApp: string }) {
  const closed = await closePerpsMarketsMatching(options, marketId =>
    market.marketId.test(marketId),
  );
  if (closed) await options.relaunchSpeculos(restoreApp);
}

// Closes markets the test opened, through the API and Speculos.
export async function closePerpsPositionsOpenedByTest({
  positionsAtStart,
  ...options
}: CleanupOptions & { positionsAtStart: ProviderPosition[] }) {
  const known = new Set(positionsAtStart.map(({ marketId }) => marketId));
  await closePerpsMarketsMatching(options, marketId => !known.has(marketId));
}
