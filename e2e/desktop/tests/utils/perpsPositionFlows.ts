import type { Application } from "tests/page";
import type { PerpsOrderSide } from "tests/page/perps.order.page";

// Smallest margin that passes the live app's order minimum.
export const MIN_ORDER_MARGIN_USD = 12;

export async function openPerpsFromPortfolio(app: Application) {
  await app.portfolio.clickPerpsEntryPoint();
  await app.perps.expectFundedAccountBalance();
}

export async function openHip3Position(
  app: Application,
  { side, marginUsd = MIN_ORDER_MARGIN_USD }: { side: PerpsOrderSide; marginUsd?: number },
) {
  await app.perpsOrder.openFirstHip3Market();
  await app.perpsOrder.selectSide(side);
  await app.perpsOrder.enterMargin(marginUsd);
  await app.perpsOrder.setAutoClose(side);
  await app.perpsOrder.expectAutoCloseSet();
  await app.perpsOrder.clickOpenPosition();
  await app.speculos.signTypedMessage();
  await app.perpsOrder.expectOrderPlaced();
}

export async function closeHip3Position(app: Application) {
  await app.perpsOrder.startClosePosition();
  await app.speculos.signTypedMessage();
  await app.perpsOrder.expectCloseRecap();
  await app.perpsOrder.expectPositionClosed();
}

// Cleanup for tests that must not leave a real position open.
export async function closeHip3PositionIfOpen(app: Application) {
  if (await app.perpsOrder.hasOpenPosition()) {
    await closeHip3Position(app);
  }
}
