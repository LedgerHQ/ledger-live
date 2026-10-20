import { useMemo } from "react";
import { useFetchCurrencyAll } from "@ledgerhq/live-common/exchange/swap/hooks/index";
import { useCurrenciesUnderFeatureFlag } from "@ledgerhq/live-common/modularDrawer/hooks/useCurrenciesUnderFeatureFlag";
import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog";
import { useFeature } from "@features/platform-feature-flags";
import { useStake } from "LLM/hooks/useStake/useStake";
import type { AccountAsset } from "LLM/utils/accountAssets";
import {
  resolveAccountAssetsByAction,
  type AccountAssetsByAction,
} from "../../../../utils/resolveAccountAssetsByAction";

export type AssetsByAction = Readonly<{
  byAction: AccountAssetsByAction;
  deactivatedCurrencyIds: ReadonlySet<string>;
}>;

export function useAssetsByAction(assets: readonly AccountAsset[]): AssetsByAction {
  const { getSupportedCryptoCurrencyIds } = useRampCatalog();
  const { data: currenciesForSwapAll } = useFetchCurrencyAll();
  const { deactivatedCurrencyIds } = useCurrenciesUnderFeatureFlag();
  const { getCanStakeCurrency } = useStake();
  const ptxServiceCtaScreens = useFeature("ptxServiceCtaScreens");
  const isRampEnabled = ptxServiceCtaScreens?.enabled ?? true;

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
    return resolveAccountAssetsByAction(assets, {
      isBuyable: id => isRampEnabled && isActive(id) && buyableIds.has(id),
      isSellable: id => isRampEnabled && isActive(id) && sellableIds.has(id),
      isSwappable: id => isActive(id) && swappableIds.has(id),
      isStakeable: id => isActive(id) && getCanStakeCurrency(id),
    });
  }, [
    assets,
    buyableIds,
    deactivatedCurrencyIds,
    getCanStakeCurrency,
    isRampEnabled,
    sellableIds,
    swappableIds,
  ]);

  return { byAction, deactivatedCurrencyIds };
}
