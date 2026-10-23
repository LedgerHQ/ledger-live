import { useMemo } from "react";
import { hasAnyFunds, type AssetsByAction } from "@features/platform-quick-actions";
import type { AccountHeroPort } from "../hero/types";
import { hasAccountActivity } from "../logic/hasAccountActivity";
import { resolveAccountHeroAvailability } from "../logic/resolveAccountHeroAvailability";

type ActivityAccount = Parameters<typeof hasAccountActivity>[0];
type FundedAssets = Parameters<typeof hasAnyFunds>[0];

export type AccountSupport = Readonly<{
  isCurrencySupported: boolean;
  isSendSupported: boolean;
  isReceiveSupported: boolean;
}>;

export type AccountHeroStatus = Pick<AccountHeroPort, "availability" | "hasFunds" | "hasActivity">;

export function useAccountHeroStatus(
  account: ActivityAccount,
  assets: FundedAssets,
  byAction: AssetsByAction<unknown>,
  { isCurrencySupported, isSendSupported, isReceiveSupported }: AccountSupport,
): AccountHeroStatus {
  return useMemo(
    () => ({
      availability: resolveAccountHeroAvailability(byAction, {
        isCurrencySupported,
        isSendSupported,
        isReceiveSupported,
      }),
      hasFunds: hasAnyFunds(assets),
      hasActivity: hasAccountActivity(account),
    }),
    [account, assets, byAction, isCurrencySupported, isReceiveSupported, isSendSupported],
  );
}
