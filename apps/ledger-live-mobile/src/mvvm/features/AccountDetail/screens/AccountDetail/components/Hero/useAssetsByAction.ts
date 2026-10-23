import { useFetchCurrencyAll } from "@ledgerhq/live-common/exchange/swap/hooks/index";
import { useCurrenciesUnderFeatureFlag } from "@ledgerhq/live-common/modularDrawer/hooks/useCurrenciesUnderFeatureFlag";
import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog";
import { useStake } from "LLM/hooks/useStake/useStake";
import { useAvailableAssetsByAction } from "@features/flow-account-detail-hero";
import type { AccountAsset, AccountAssetsByAction } from "LLM/utils/accountAssets";

export type AssetsByAction = Readonly<{
  byAction: AccountAssetsByAction;
  deactivatedCurrencyIds: ReadonlySet<string>;
}>;

export function useAssetsByAction(assets: readonly AccountAsset[]): AssetsByAction {
  const { getSupportedCryptoCurrencyIds } = useRampCatalog();
  const { data: swappableIds } = useFetchCurrencyAll();
  const { deactivatedCurrencyIds } = useCurrenciesUnderFeatureFlag();
  const { getCanStakeCurrency } = useStake();

  const byAction = useAvailableAssetsByAction(assets, {
    getRampIds: getSupportedCryptoCurrencyIds,
    swappableIds,
    deactivatedIds: deactivatedCurrencyIds,
    isStakeable: getCanStakeCurrency,
  });

  return { byAction, deactivatedCurrencyIds };
}
