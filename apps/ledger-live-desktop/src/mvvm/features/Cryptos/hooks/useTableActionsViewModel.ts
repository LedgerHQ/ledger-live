import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { useOpenAssetFlow } from "LLD/features/ModularDrawer/hooks/useOpenAssetFlow";
import { ModularDrawerLocation } from "LLD/features/ModularDrawer";
import { MAD_SOURCE_PAGES } from "LLD/features/ModularDrawer/analytics/modularDrawer.types";
import useAddAccountAnalytics from "LLD/features/AddAccountDrawer/analytics/useAddAccountAnalytics";
import { ADD_ACCOUNT_EVENTS_NAME } from "LLD/features/AddAccountDrawer/analytics/addAccount.types";
import { useRefreshAccountsOrdering } from "~/renderer/actions/general";
import { saveSettings, useHideEmptyTokenAccounts } from "~/renderer/actions/settings";
import { getOrderAccounts } from "~/renderer/reducers/settings";
import {
  CRYPTO_TRACKING_PAGE_NAME,
  ORDER_KEYS,
  FILTER_SHOW_ALL,
  FILTER_HIDE_EMPTY,
} from "../constants";

export type TableActionsViewModelParams = {
  searchValue: string;
  setSearchValue: (value: string) => void;
};

export function useTableActionsViewModel({
  searchValue,
  setSearchValue,
}: TableActionsViewModelParams) {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const orderAccounts = useSelector(getOrderAccounts);
  const refreshAccountsOrdering = useRefreshAccountsOrdering();
  const [hideEmptyTokenAccounts, setHideEmptyTokenAccounts] = useHideEmptyTokenAccounts();

  const { openAssetFlow } = useOpenAssetFlow(
    { location: ModularDrawerLocation.ADD_ACCOUNT },
    MAD_SOURCE_PAGES.CRYPTOS_PAGE,
  );
  const { trackAddAccountEvent } = useAddAccountAnalytics();

  const handleAddAddressClick = useCallback(() => {
    trackAddAccountEvent(ADD_ACCOUNT_EVENTS_NAME.ADD_ACCOUNT_BUTTON_CLICKED, {
      button: "Add address",
      page: CRYPTO_TRACKING_PAGE_NAME,
    });
    openAssetFlow();
  }, [openAssetFlow, trackAddAccountEvent]);

  const onOrderChange = useCallback(
    (item: { key?: string }) => {
      if (item?.key == null) return;
      dispatch(saveSettings({ orderAccounts: item.key }));
      refreshAccountsOrdering();
    },
    [dispatch, refreshAccountsOrdering],
  );

  const orderItems = useMemo(
    () =>
      ORDER_KEYS.map(key => ({
        key,
        label: t(`accounts.order.${key}`),
      })),
    [t],
  );

  const orderValue = orderItems.find(item => item.key === orderAccounts) ?? null;

  const filterItems = useMemo(
    () => [
      { key: FILTER_SHOW_ALL, label: t("cryptos.tableActions.showAll") },
      { key: FILTER_HIDE_EMPTY, label: t("cryptos.tableActions.hideEmptyAccounts") },
    ],
    [t],
  );

  const filterValue =
    filterItems.find(
      item => item.key === (hideEmptyTokenAccounts ? FILTER_HIDE_EMPTY : FILTER_SHOW_ALL),
    ) ?? filterItems[0];

  const onFilterChange = useCallback(
    (item: { key?: string }) => {
      if (item.key != null) {
        setHideEmptyTokenAccounts(item.key === FILTER_HIDE_EMPTY);
      }
    },
    [setHideEmptyTokenAccounts],
  );

  return {
    t,
    searchValue,
    setSearchValue,
    handleAddAddressClick,
    orderItems,
    orderValue,
    onOrderChange,
    filterItems,
    filterValue,
    onFilterChange,
  };
}
