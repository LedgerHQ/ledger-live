import { useMemo } from "react";
import type { Account } from "@ledgerhq/types-live";
import { useFetchCurrencyAll } from "@ledgerhq/live-common/exchange/swap/hooks/index";
import { useFeatureFlaggedCurrencies } from "@features/platform-currencies";
import { resolveSwapConsole } from "@features/flow-account-detail-hero";
import { listHeldAssets } from "@features/platform-quick-actions";
import { useSelector } from "LLD/hooks/redux";
import { blacklistedTokenIdsSelector } from "~/renderer/reducers/settings";

export function useAccountSwapConsole(account: Account | undefined): boolean | undefined {
  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);
  const { data: swappableIds, isResolved } = useFetchCurrencyAll();
  const { deactivatedCurrencyIds } = useFeatureFlaggedCurrencies(!!process.env.MOCK);

  const isSwapAvailable = useMemo(() => {
    if (!account) return false;
    const swappable = new Set(swappableIds);
    return listHeldAssets(account, new Set(blacklistedTokenIds)).some(
      ({ currency }) => !deactivatedCurrencyIds.has(currency.id) && swappable.has(currency.id),
    );
  }, [account, blacklistedTokenIds, deactivatedCurrencyIds, swappableIds]);

  if (!account) return undefined;
  const isCurrencySupported = !deactivatedCurrencyIds.has(account.currency.id);
  if (isCurrencySupported && !isResolved) return undefined;
  return resolveSwapConsole("desktop", { isCurrencySupported, isSwapAvailable });
}
