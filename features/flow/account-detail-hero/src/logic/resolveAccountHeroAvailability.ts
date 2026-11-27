import type { AssetsByAction } from "@features/platform-quick-actions";
import type { AccountHeroAvailability } from "../hero/types";

type AccountSupport = Pick<
  AccountHeroAvailability,
  "isCurrencySupported" | "isSendSupported" | "isReceiveSupported"
> &
  Readonly<{ isSwapSupported: boolean }>;

export function resolveAccountHeroAvailability(
  byAction: AssetsByAction<unknown>,
  { isSwapSupported, ...support }: AccountSupport,
): AccountHeroAvailability {
  return {
    ...support,
    isBuyAvailable: byAction.buy.length > 0,
    isSellAvailable: byAction.sell.length > 0,
    isSwapAvailable: isSwapSupported && byAction.swap.length > 0,
    isEarnAvailable: byAction.earn.length > 0,
  };
}
