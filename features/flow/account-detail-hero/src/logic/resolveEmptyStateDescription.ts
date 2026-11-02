import type { FundingAction } from "./resolveEmptyState";

export type EmptyStateDescription =
  | "receive"
  | "receiveSwap"
  | "receiveBuy"
  | "receiveSwapBuy"
  | "swap"
  | "buy"
  | "swapBuy";

const DESCRIPTION_BY_ACTIONS: Readonly<Partial<Record<string, EmptyStateDescription>>> = {
  receive: "receive",
  "receive,swap": "receiveSwap",
  "receive,buy": "receiveBuy",
  "receive,swap,buy": "receiveSwapBuy",
  swap: "swap",
  buy: "buy",
  "swap,buy": "swapBuy",
};

const ACTION_ORDER: readonly FundingAction[] = ["receive", "swap", "buy"];

export function resolveEmptyStateDescription(
  fundingActions: readonly FundingAction[],
): EmptyStateDescription | undefined {
  const actions = ACTION_ORDER.filter(action => fundingActions.includes(action));
  return DESCRIPTION_BY_ACTIONS[actions.join(",")];
}
