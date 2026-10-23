import { useMemo } from "react";
import { useFetchCurrencyAll } from "@ledgerhq/live-common/exchange/swap/hooks/index";
import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog";
import useEnv from "@features/platform-env";
import { useFeatureFlaggedCurrencies } from "@features/platform-currencies";
import { resolveAssetsByAction } from "@features/platform-quick-actions";
import { useStake } from "LLD/hooks/useStake";
import type { AccountAsset, AccountAssetsByAction } from "./types";

export type AssetsByActionResult = Readonly<{
  byAction: AccountAssetsByAction;
  deactivatedCurrencyIds: ReadonlySet<string>;
}>;

export function useAssetsByAction(assets: readonly AccountAsset[]): AssetsByActionResult {
  const { getSupportedCryptoCurrencyIds } = useRampCatalog();
  const { data: currenciesForSwapAll } = useFetchCurrencyAll();
  const { deactivatedCurrencyIds } = useFeatureFlaggedCurrencies(!!useEnv("MOCK"));
  const { getCanStakeCurrency } = useStake();

  const buyableIds = useMemo(
    () => new Set(getSupportedCryptoCurrencyIds("onRamp") ?? []),
    [getSupportedCryptoCurrencyIds],
  );
  const sellableIds = useMemo(
    () => new Set(getSupportedCryptoCurrencyIds("offRamp") ?? []),
    [getSupportedCryptoCurrencyIds],
  );
  const swappableIds = useMemo(() => new Set(currenciesForSwapAll), [currenciesForSwapAll]);

  const byAction = useMemo(() => {
    const isActive = (id: string) => !deactivatedCurrencyIds.has(id);
    return resolveAssetsByAction(assets, {
      isBuyable: id => isActive(id) && buyableIds.has(id),
      isSellable: id => isActive(id) && sellableIds.has(id),
      isSwappable: id => isActive(id) && swappableIds.has(id),
      isStakeable: id => isActive(id) && getCanStakeCurrency(id),
    });
  }, [assets, buyableIds, deactivatedCurrencyIds, getCanStakeCurrency, sellableIds, swappableIds]);

  return { byAction, deactivatedCurrencyIds };
}
