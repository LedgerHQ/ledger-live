import { useMemo } from "react";
import type { Account } from "@ledgerhq/types-live";
import { isAccountEmpty } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { usePrecomputedAssetListData } from "LLM/components/AssetListItem/usePrecomputedAssetListData";
import type { AssetListItemViewModelResult } from "LLM/components/AssetListItem/usePrecomputedAssetListData";
import { useCalculateCountervalueCallback } from "~/actions/general";
import { useSelector } from "~/context/hooks";
import {
  blacklistedTokenIdsSelector,
  hideEmptyTokenAccountsEnabledSelector,
} from "~/reducers/settings";
import type { Asset } from "~/types/asset";
import { buildAccountAssets } from "../../../../utils/buildAccountAssets";

export type AssetsSectionViewModel = Readonly<{
  isVisible: boolean;
  assets: Asset[];
  precomputed: Map<string, AssetListItemViewModelResult>;
}>;

export function useAssetsSectionViewModel(account: Account): AssetsSectionViewModel {
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

  return {
    isVisible: !isAccountEmpty(account),
    assets,
    precomputed: usePrecomputedAssetListData(assets),
  };
}
