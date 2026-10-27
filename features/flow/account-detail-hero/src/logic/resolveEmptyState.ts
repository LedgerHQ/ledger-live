import type { AccountHeroAvailability } from "../hero/types";

export type FundingAction = "receive" | "swap" | "buy";

export type AccountEmptyStateModel = Readonly<{
  isVisible: boolean;
  fundingActions: readonly FundingAction[];
}>;

type Input = Readonly<{ hasActivity: boolean; availability: AccountHeroAvailability }>;

/** The empty state replaces the sections while the account has no activity. */
export function resolveEmptyState({ hasActivity, availability }: Input): AccountEmptyStateModel {
  const { isCurrencySupported, isReceiveSupported, isSwapAvailable, isBuyAvailable } = availability;
  const fundingActions: FundingAction[] = [
    ...(isReceiveSupported ? (["receive"] as const) : []),
    ...(isCurrencySupported && isSwapAvailable ? (["swap"] as const) : []),
    ...(isCurrencySupported && isBuyAvailable ? (["buy"] as const) : []),
  ];
  return { isVisible: !hasActivity, fundingActions };
}
