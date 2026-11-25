import { AppInfos } from "@ledgerhq/live-e2e-shared/enum/AppInfos";
import type { Application } from "tests/page";
import type { PerpsOrderSide } from "tests/page/perps.order.page";

// Real broadcast, and no app installs that would crash Speculos.
export const PERPS_REAL_BROADCAST_ENV = {
  SWAP_DISABLE_APPS_INSTALL: "true",
  DISABLE_TRANSACTION_BROADCAST: "0",
};
// Smallest margin that passes the live app's order minimum.
export const MIN_ORDER_MARGIN_USD = 12;

export async function openPerpsFromPortfolio(app: Application) {
  await app.portfolio.clickPerpsEntryPoint();
  await app.perps.expectFundedAccountBalance();
}

export async function openHip3Position(
  app: Application,
  relaunchSpeculos: (appName: string) => Promise<unknown>,
  { side, marginUsd = MIN_ORDER_MARGIN_USD }: { side: PerpsOrderSide; marginUsd?: number },
) {
  await app.perpsOrder.openFirstHip3MarketWithoutPosition();
  await app.perpsOrder.selectSide(side);
  await app.perpsOrder.enterMargin(marginUsd);
  await app.perpsOrder.setAutoClose(side);
  await app.perpsOrder.expectAutoCloseSet();
  await relaunchSpeculos(AppInfos.HYPERLIQUID.name);
  await app.perpsOrder.clickOpenPosition();
  await app.speculos.signHyperliquidMessage();
  await app.perpsOrder.expectOrderPlaced();
}

export async function closeHip3Position(
  app: Application,
  relaunchSpeculos: (appName: string) => Promise<unknown>,
) {
  await relaunchSpeculos(AppInfos.HYPERLIQUID.name);
  await app.perpsOrder.startClosePosition();
  await app.speculos.signHyperliquidMessage();
  await app.perpsOrder.expectCloseRecap();
  await app.perpsOrder.expectPositionClosed();
}

// Cleanup for tests that must not leave a real position open.
export async function closeHip3PositionIfOpen(
  app: Application,
  relaunchSpeculos: (appName: string) => Promise<unknown>,
) {
  if (await app.perpsOrder.hasOpenPosition()) {
    await closeHip3Position(app, relaunchSpeculos);
  }
}
