import type { PerpsActionRequest, PerpsActionType, PerpsOrder, PerpsPosition } from "./perpsApi";

/** Only actions that reduce exposure may reach the exchange. */
const SUBMITTABLE_ACTIONS = new Set<PerpsActionType>(["close", "cancelOrder"]);

/** Caps the margin of an order a test setup may submit. */
export const MAX_OPEN_MARGIN_USD = 10;

export type PerpsOpenOrder = {
  marketId: string;
  side: "long" | "short";
  marginUsd: number;
  leverage: number;
};

export const closeRequests = (address: string, positions: PerpsPosition[]): PerpsActionRequest[] =>
  positions.map(({ providerId, marketId }) => ({
    providerId,
    address,
    action: "close",
    args: { marketId },
  }));

export const cancelRequests = (address: string, orders: PerpsOrder[]): PerpsActionRequest[] =>
  orders.map(({ providerId, cancelArgs }) => ({
    providerId,
    address,
    action: "cancelOrder",
    args: cancelArgs,
  }));

export const providerOf = (marketId: string): string =>
  marketId.startsWith("hyperliquid-xyz-") ? "hyperliquid-xyz" : "hyperliquid";

/** Same payload as the live app's market order, margin in USD. */
export function openRequest(
  address: string,
  { marketId, side, marginUsd, leverage }: PerpsOpenOrder,
): PerpsActionRequest {
  if (!(marginUsd > 0 && marginUsd <= MAX_OPEN_MARGIN_USD)) {
    throw new RangeError(`Open margin must be above 0 and at most ${MAX_OPEN_MARGIN_USD} USD`);
  }
  return {
    providerId: providerOf(marketId),
    address,
    action: "open",
    args: { marketId, side, amount: marginUsd.toFixed(6), marginMode: "isolated", leverage },
  };
}

/** `allowOpen` comes only from `PerpsRunner.openPosition`. */
export function assertSubmittable(
  action: PerpsActionType,
  dryRun: boolean,
  allowOpen = false,
): void {
  if (dryRun || SUBMITTABLE_ACTIONS.has(action)) return;
  if (action === "open" && allowOpen) return;
  throw new Error(
    `Refusing to submit "${action}": only close and cancel are allowed, open only through openPosition`,
  );
}
