import { useCallback, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import type { ParamListBase } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { Account } from "@ledgerhq/types-live";
import { usePrecomputedAssetListData } from "LLM/components/AssetListItem/usePrecomputedAssetListData";
import type { AssetListItemViewModelResult } from "LLM/components/AssetListItem/usePrecomputedAssetListData";
import { useCalculateCountervalueCallback } from "~/actions/general";
import { useSelector } from "~/context/hooks";
import perFamilyAddAssetAction from "~/generated/AddAssetAction";
import {
  blacklistedTokenIdsSelector,
  hideEmptyTokenAccountsEnabledSelector,
} from "~/reducers/settings";
import type { Asset } from "~/types/asset";
import { buildAccountAssets } from "../../../../utils/buildAccountAssets";

type AddAssetAction = (
  navigation: NativeStackNavigationProp<ParamListBase>,
  accountId: string,
) => void;

export type AssetsSectionViewModel = Readonly<{
  assets: Asset[];
  precomputed: Map<string, AssetListItemViewModelResult>;
  /** Set only for a family where an asset must be added to the account before it can be received. */
  onAddAsset: (() => void) | undefined;
}>;

export function useAssetsSectionViewModel(account: Account): AssetsSectionViewModel {
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  const hideEmptyTokenAccounts = useSelector(hideEmptyTokenAccountsEnabledSelector);
  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);
  const calculateCountervalue = useCalculateCountervalueCallback();

  const assets = useMemo(
    () =>
      buildAccountAssets(account, {
        hideEmptyTokenAccounts,
        blacklistedTokenIds: new Set(blacklistedTokenIds),
        calculateCountervalue,
      }),
    [account, hideEmptyTokenAccounts, blacklistedTokenIds, calculateCountervalue],
  );

  const addAssetAction = (perFamilyAddAssetAction as Record<string, AddAssetAction | undefined>)[
    account.currency.family
  ];
  const onAddAsset = useCallback(() => {
    addAssetAction?.(navigation, account.id);
  }, [account.id, addAssetAction, navigation]);

  return {
    assets,
    precomputed: usePrecomputedAssetListData(assets),
    onAddAsset: addAssetAction ? onAddAsset : undefined,
  };
}
