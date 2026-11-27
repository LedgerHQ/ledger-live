import { AppInfos } from "@ledgerhq/live-e2e-shared/enum/AppInfos";
import { closePerpsMarkets, openPerpsPosition } from "@ledgerhq/live-e2e-shared/perps/perpsFlow";
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

type PerpsAccount = { account: Account; userdataFile: string };

// Opens through the API, so a broken UI cannot block setup.
export async function openPerpsPositionThroughDriver({
  account,
  userdataFile,
  market,
  side,
  relaunchSpeculos,
}: PerpsAccount & {
  market: PerpsMarketGroup;
  side: PerpsOrderSide;
  relaunchSpeculos: RelaunchSpeculos;
}): Promise<ProviderPosition> {
  const address = await getSavedAccountAddress(userdataFile, account);
  const device = await relaunchSpeculos(AppInfos.HYPERLIQUID.name);
  const marketId = market.setupMarketId;
  await openPerpsPosition({
    address,
    speculosApiPort: device.port,
    derivationPath: account.accountPath,
    order: { marketId, side, marginUsd: ORDER_MARGIN_USD, leverage: ORDER_LEVERAGE },
  });
  return { marketId, symbol: await new PerpsApi().getMarketSymbol(marketId) };
}

async function marketsInUse(api: PerpsApi, address: string): Promise<string[]> {
  const [positions, orders] = await Promise.all([
    api.getPositions(address),
    api.getOrders(address),
  ]);
  return [...new Set([...positions, ...orders].map(({ marketId }) => marketId))];
}

// Markets with a position or an open order, read through the API.
export async function readPerpsMarketsInUse({
  account,
  userdataFile,
}: PerpsAccount): Promise<ProviderPosition[]> {
  const api = new PerpsApi();
  const address = await getSavedAccountAddress(userdataFile, account);
  const marketIds = await marketsInUse(api, address);
  return Promise.all(
    marketIds.map(async marketId => ({ marketId, symbol: await api.getMarketSymbol(marketId) })),
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
  const targets = async () => (await marketsInUse(api, address)).filter(isTarget);
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
    throw new Error(`Perps positions or orders still open on ${left.join(", ")}`, {
      cause: lastError,
    });
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
  marketsAtStart,
  ...options
}: CleanupOptions & { marketsAtStart: ProviderPosition[] }) {
  const known = new Set(marketsAtStart.map(({ marketId }) => marketId));
  await closePerpsMarketsMatching(options, marketId => !known.has(marketId));
}
