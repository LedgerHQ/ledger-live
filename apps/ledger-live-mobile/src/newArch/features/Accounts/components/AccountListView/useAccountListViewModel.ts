import { useCallback, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useFocusEffect } from "@react-navigation/core";
import { useGlobalSyncState } from "@ledgerhq/live-common/bridge/react/index";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { useDistribution, useRefreshAccountsOrdering } from "~/actions/general";
import { accountsSelector, isUpToDateSelector } from "~/reducers/accounts";
import { blacklistedTokenIdsSelector } from "~/reducers/settings";
import { Asset } from "~/types/asset";

export interface Props {
  displayType: "Assets" | "Accounts";
}

const useAccountListViewModel = ({ displayType }: Props) => {
  const hideEmptyTokenAccount = useEnv("HIDE_EMPTY_TOKEN_ACCOUNTS");
  const isUpToDate = useSelector(isUpToDateSelector);
  const globalSyncState = useGlobalSyncState();
  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);
  const accounts = useSelector(accountsSelector);
  const blacklistedTokenIdsSet = useMemo(() => new Set(blacklistedTokenIds), [blacklistedTokenIds]);

  const distribution = useDistribution({
    showEmptyAccounts: true,
    hideEmptyTokenAccount,
  });

  const refreshAccountsOrdering = useRefreshAccountsOrdering();
  useFocusEffect(refreshAccountsOrdering);

  const syncPending = globalSyncState.pending && !isUpToDate;

  const assets: Asset[] = useMemo(
    () => (distribution.isAvailable && distribution.list.length > 0 ? distribution.list : []),
    [distribution],
  );

  const assetsToDisplay = useMemo(
    () =>
      assets.filter(
        asset =>
          asset.currency.type !== "TokenCurrency" || !blacklistedTokenIdsSet.has(asset.currency.id),
      ),
    [assets, blacklistedTokenIdsSet],
  );

  const [isAddModalOpened, setAddModalOpened] = useState(false);

  const openAddModal = useCallback(() => setAddModalOpened(true), []);
  const closeAddModal = useCallback(() => setAddModalOpened(false), []);

  return {
    displayType,
    syncPending,
    assetsToDisplay,
    isAddModalOpened,
    accounts,
    openAddModal,
    closeAddModal,
  };
};

export default useAccountListViewModel;
