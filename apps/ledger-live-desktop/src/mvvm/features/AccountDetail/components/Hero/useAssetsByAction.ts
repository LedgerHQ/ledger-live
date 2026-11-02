import { useFetchCurrencyAll } from "@ledgerhq/live-common/exchange/swap/hooks/index";
import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog";
import { useFeatureFlaggedCurrencies } from "@features/platform-currencies";
import { useAvailableAssetsByAction } from "@features/flow-account-detail-hero";
import { useStake } from "LLD/hooks/useStake";
import type { AccountAsset, AccountAssetsByAction } from "./types";

export type AssetsByActionResult = Readonly<{
  byAction: AccountAssetsByAction;
  deactivatedCurrencyIds: ReadonlySet<string>;
}>;

export function useAssetsByAction(assets: readonly AccountAsset[]): AssetsByActionResult {
  const { getSupportedCryptoCurrencyIds } = useRampCatalog();
  const { data: swappableIds } = useFetchCurrencyAll();
  const { deactivatedCurrencyIds } = useFeatureFlaggedCurrencies(!!process.env.MOCK);
  const { getCanStakeCurrency } = useStake();

  const byAction = useAvailableAssetsByAction(assets, {
    getRampIds: getSupportedCryptoCurrencyIds,
    swappableIds,
    deactivatedIds: deactivatedCurrencyIds,
    isStakeable: getCanStakeCurrency,
  });

  return { byAction, deactivatedCurrencyIds };
}
