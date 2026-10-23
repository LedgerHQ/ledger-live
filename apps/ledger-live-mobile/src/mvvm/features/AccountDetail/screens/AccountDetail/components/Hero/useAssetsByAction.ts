import { useMemo } from "react";
import { useFetchCurrencyAll } from "@ledgerhq/live-common/exchange/swap/hooks/index";
import { useCurrenciesUnderFeatureFlag } from "@ledgerhq/live-common/modularDrawer/hooks/useCurrenciesUnderFeatureFlag";
import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog";
import { useStake } from "LLM/hooks/useStake/useStake";
import { resolveAssetsByAction } from "@features/platform-quick-actions";
import type { AccountAsset, AccountAssetsByAction } from "LLM/utils/accountAssets";

export type AssetsByAction = Readonly<{
  byAction: AccountAssetsByAction;
  deactivatedCurrencyIds: ReadonlySet<string>;
}>;

export function useAssetsByAction(assets: readonly AccountAsset[]): AssetsByAction {
  const { getSupportedCryptoCurrencyIds } = useRampCatalog();
  const { data: currenciesForSwapAll } = useFetchCurrencyAll();
  const { deactivatedCurrencyIds } = useCurrenciesUnderFeatureFlag();
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
