import { track } from "@shared/analytics";
import { useCallback, useMemo, useState } from "react";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { NavigatorName, ScreenName } from "~/const";
import useDynamicContent from "~/dynamicContent/useDynamicContent";
import { useFeature, useWalletFeaturesConfig } from "@features/platform-feature-flags";
import { useSelector } from "~/context/hooks";
import { hasUnreadOperationsSelector } from "~/reducers/history";
import { useSyncIndicator } from "./hooks/useSyncIndicator";
import { usePortfolioBalance } from "LLM/hooks/usePortfolioBalance";

const BUTTON_CLICKED_EVENT = "button_clicked";

export function useTopBarViewModel(
  navigation: NativeStackNavigationProp<{ [key: string]: object | undefined }>,
  screenName?: string,
) {
  const { notificationCards } = useDynamicContent();
  const web3hub = useFeature("web3hub");
  const { shouldDisplayOperationsList, shouldDisplayAssetDiscoverability } =
    useWalletFeaturesConfig("mobile");
  const page = screenName ?? ScreenName.Portfolio;
  const {
    hasAccounts,
    isError,
    isPending,
    listOfErrorAccountNames,
    syncAccessibilityLabel,
    errorCurrencyIds,
  } = useSyncIndicator();
  const { triggerRefresh, isBridgeSyncPending } = usePortfolioBalance();

  const [isSyncDrawerOpen, setIsSyncDrawerOpen] = useState(false);
  const openSyncDrawer = useCallback(() => {
    setIsSyncDrawerOpen(true);
    track("SyncErrorList", {
      currencies: errorCurrencyIds,
      page,
    });
  }, [errorCurrencyIds, page]);
  const closeSyncDrawer = useCallback(() => setIsSyncDrawerOpen(false), []);

  const [hasTryRefreshBeenRequested, setHasTryRefreshBeenRequested] = useState(false);
  const isTryRefreshPending = hasTryRefreshBeenRequested && isBridgeSyncPending;

  const onTryRefresh = useCallback(() => {
    setHasTryRefreshBeenRequested(true);
    triggerRefresh();
    closeSyncDrawer();
  }, [triggerRefresh, closeSyncDrawer]);

  const hasUnreadNotifications = useMemo(
    () => notificationCards.some(n => !n.viewed),
    [notificationCards],
  );

  const hasUnreadOperations = useSelector(hasUnreadOperationsSelector);

  const onMyWalletPress = useCallback(() => {
    track(BUTTON_CLICKED_EVENT, { button: "My Wallet", page });
    navigation.navigate(NavigatorName.MyWallet, {
      screen: ScreenName.MyWallet,
    });
  }, [navigation, page]);

  const onDiscoverPress = useCallback(() => {
    track(BUTTON_CLICKED_EVENT, { button: "Discover", page });
    if (web3hub?.enabled) {
      navigation.navigate(NavigatorName.Web3HubTab, {
        screen: ScreenName.Web3HubMain,
      });
    } else {
      navigation.navigate(NavigatorName.Discover, {
        screen: ScreenName.DiscoverScreen,
      });
    }
  }, [navigation, page, web3hub?.enabled]);

  const onTransactionHistoryPress = useCallback(() => {
    track(BUTTON_CLICKED_EVENT, { button: "operation_list", page });
    navigation.navigate(NavigatorName.OperationsHistory, {
      screen: ScreenName.OperationsList,
    });
  }, [navigation, page]);

  const onSearchPress = useCallback(() => {
    track(BUTTON_CLICKED_EVENT, { button: "Search", page });
    navigation.navigate(NavigatorName.GlobalSearch, {
      screen: ScreenName.GlobalSearch,
      params: { source: page },
    });
  }, [navigation, page]);

  return {
    shouldDisplayAssetDiscoverability,
    onSearchPress,
    onMyWalletPress,
    shouldDisplayOperationsList,
    onDiscoverPress,
    onTransactionHistoryPress,
    hasUnreadNotifications,
    hasUnreadOperations,
    hasAccounts,
    isSyncError: isError,
    isSyncPending: isPending || isTryRefreshPending,
    listOfErrorAccountNames,
    syncAccessibilityLabel,
    isSyncDrawerOpen,
    openSyncDrawer,
    closeSyncDrawer,
    onTryRefresh,
  };
}
