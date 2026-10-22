import { useCallback, useMemo } from "react";
import { usePrecomputedAssetListData } from "LLM/components/AssetListItem/usePrecomputedAssetListData";
import type { AssetListItemViewModelResult } from "LLM/components/AssetListItem/usePrecomputedAssetListData";
import type { AccountAsset } from "LLM/utils/accountAssets";
import { sortAssetsByValue } from "@features/platform-quick-actions";
import { useCalculateCountervalueCallback } from "~/actions/general";
import type { Asset } from "~/types/asset";

export type AccountAssetPickerRow = Readonly<{
  asset: Asset;
  precomputed: AssetListItemViewModelResult;
}>;

export type AccountAssetPickerSheetViewModel = Readonly<{
  rows: readonly AccountAssetPickerRow[];
  onRowPress: (asset: Asset) => void;
}>;

const toListAsset = ({ currency, account }: AccountAsset): Asset => ({
  currency,
  accounts: [account],
  amount: account.balance.toNumber(),
});

export function useAccountAssetPickerSheetViewModel(
  assets: readonly AccountAsset[],
  onSelect: (asset: AccountAsset) => void,
): AccountAssetPickerSheetViewModel {
  const calculateCountervalue = useCalculateCountervalueCallback();
  const listAssets = useMemo(
    () =>
      sortAssetsByValue(
        assets,
        ({ currency, account }) =>
          calculateCountervalue(currency, account.balance)?.toNumber() ?? 0,
      ).map(toListAsset),
    [assets, calculateCountervalue],
  );
  const precomputed = usePrecomputedAssetListData(listAssets);

  const rows = useMemo(
    () =>
      listAssets.flatMap(asset => {
        const data = precomputed.get(asset.currency.id);
        return data ? [{ asset, precomputed: data }] : [];
      }),
    [listAssets, precomputed],
  );

  const onRowPress = useCallback(
    (listAsset: Asset) => {
      const asset = assets.find(({ currency }) => currency.id === listAsset.currency.id);
      if (asset) onSelect(asset);
    },
    [assets, onSelect],
  );

  return { rows, onRowPress };
}
