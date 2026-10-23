import { useMemo } from "react";
import type { Account } from "@ledgerhq/types-live";
import { resolveSwapConsole } from "@features/flow-account-detail-hero";
import { listHeldAssets } from "@features/platform-quick-actions";
import { useSelector } from "LLD/hooks/redux";
import { blacklistedTokenIdsSelector } from "~/renderer/reducers/settings";
import { useAssetsByAction } from "./useAssetsByAction";

export function useAccountSwapConsole(account: Account | undefined): boolean | undefined {
  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);
  const assets = useMemo(
    () => (account ? listHeldAssets(account, new Set(blacklistedTokenIds)) : []),
    [account, blacklistedTokenIds],
  );
  const { byAction, isSwapLoading, deactivatedCurrencyIds } = useAssetsByAction(assets);

  if (!account || isSwapLoading) return undefined;
  return resolveSwapConsole("desktop", {
    isCurrencySupported: !deactivatedCurrencyIds.has(account.currency.id),
    isSwapAvailable: byAction.swap.length > 0,
  });
}
