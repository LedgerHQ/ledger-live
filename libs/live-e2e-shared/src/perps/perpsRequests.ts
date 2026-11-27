import type { PerpsActionRequest, PerpsActionType, PerpsOrder, PerpsPosition } from "./perpsApi";

/** Only actions that reduce exposure may reach the exchange. */
const SUBMITTABLE_ACTIONS = new Set<PerpsActionType>(["close", "cancelOrder"]);

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

export function assertSubmittable(action: PerpsActionType, dryRun: boolean): void {
  if (!dryRun && !SUBMITTABLE_ACTIONS.has(action)) {
    throw new Error(`Refusing to submit "${action}": only close and cancel are allowed`);
  }
}
