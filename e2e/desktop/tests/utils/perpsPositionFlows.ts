import { AppInfos } from "@ledgerhq/live-e2e-shared/enum/AppInfos";
import type { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import type { Application } from "tests/page";
import { getSavedAccountAddress } from "tests/utils/userdata";
import type { PerpsOrderSide } from "tests/page/perps.order.page";

// Real broadcast, overriding any host value.
export const PERPS_REAL_BROADCAST_ENV = { DISABLE_TRANSACTION_BROADCAST: "0" };

// Notional of 15 USD passes the live app's order minimum.
export const ORDER_MARGIN_USD = 5;
export const ORDER_LEVERAGE = 3;

type RelaunchSpeculos = (appName: string) => Promise<unknown>;

export async function openPerpsFromPortfolio(app: Application) {
  await app.portfolio.clickPerpsEntryPoint();
  await app.perps.expectFundedAccountBalance();
}

export async function openHip3Position(
  app: Application,
  {
    side,
    relaunchSpeculos,
    marginUsd = ORDER_MARGIN_USD,
    leverage = ORDER_LEVERAGE,
  }: {
    side: PerpsOrderSide;
    relaunchSpeculos: RelaunchSpeculos;
    marginUsd?: number;
    leverage?: number;
  },
) {
  await app.perpsOrder.openFirstHip3Market();
  await app.perpsOrder.selectSide(side);
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

export async function closeHip3Position(
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

// The provider lists the open positions, so no market has to be scanned.
export async function closeOpenHip3Positions(
  app: Application,
  {
    account,
    userdataFile,
    relaunchSpeculos,
  }: { account: Account; userdataFile: string; relaunchSpeculos: RelaunchSpeculos },
) {
  const address = await getSavedAccountAddress(userdataFile, account);
  const positions = await app.perpsOrder.getProviderHip3Positions(address);
  for (const position of positions) {
    await app.perpsOrder.openPositionFromList(position);
    await closeHip3Position(app, { relaunchSpeculos });
    await app.perpsOrder.expectPositionRowHidden(position);
  }
  await app.perpsOrder.expectNoProviderHip3Positions(address);
}
