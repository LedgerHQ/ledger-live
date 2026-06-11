import { useCallback, useMemo, useState } from "react";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { NavigatorName, ScreenName } from "~/const";
import useDynamicContent from "~/dynamicContent/useDynamicContent";
import { track } from "~/analytics";
import { setOriginFlow } from "~/analytics/originFlow";
import { HOOKS_TRACKING_LOCATIONS } from "~/analytics/hooks/variables";
import { useSelector } from "~/context/hooks";
import { hasUnreadOperationsSelector } from "~/reducers/history";
import { readOnlyModeEnabledSelector } from "~/reducers/settings";
import { useFeature, useWalletFeaturesConfig } from "@features/platform-feature-flags";
import { useRebornFlow } from "LLM/features/Reborn/hooks/useRebornFlow";
import { useSyncIndicator } from "./hooks/useSyncIndicator";
import { usePortfolioBalance } from "LLM/hooks/usePortfolioBalance";

const BUTTON_CLICKED_EVENT = "button_clicked";

export function useTopBarViewModel(
  navigation: NativeStackNavigationProp<{ [key: string]: object | undefined }>,
  screenName?: string,
) {
  const { notificationCards } = useDynamicContent();
  const web3hub = useFeature("web3hub");
  const { shouldDisplayOperationsList, shouldDisplayMyWallet } = useWalletFeaturesConfig("mobile");
  const page = screenName ?? ScreenName.Portfolio;
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const { navigateToRebornFlow } = useRebornFlow();
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

  const onMyLedgerPress = useCallback(() => {
    track(BUTTON_CLICKED_EVENT, { button: "MyLedger", page });
    if (readOnlyModeEnabled) {
      setOriginFlow(HOOKS_TRACKING_LOCATIONS.myLedger);
      navigateToRebornFlow();
    } else {
      navigation.navigate(NavigatorName.MyLedger, {
        screen: ScreenName.MyLedgerChooseDevice,
        params: {
          tab: undefined,
          searchQuery: undefined,
          updateModalOpened: undefined,
        },
      });
    }
  }, [navigation, page, readOnlyModeEnabled, navigateToRebornFlow]);

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

  const onNotificationsPress = useCallback(() => {
    track(BUTTON_CLICKED_EVENT, { button: "Notifications", page });
    navigation.navigate(NavigatorName.NotificationCenter, {
      screen: ScreenName.NotificationCenter,
    });
  }, [navigation, page]);

  const onSettingsPress = useCallback(() => {
    track(BUTTON_CLICKED_EVENT, { button: "Settings", page });
    navigation.navigate(NavigatorName.Settings);
  }, [navigation, page]);

  const onTransactionHistoryPress = useCallback(() => {
    track(BUTTON_CLICKED_EVENT, { button: "operation_list", page });
    navigation.navigate(NavigatorName.OperationsHistory, {
      screen: ScreenName.OperationsList,
    });
  }, [navigation, page]);

  return {
    onMyLedgerPress,
    onMyWalletPress,
    shouldDisplayMyWallet,
    shouldDisplayOperationsList,
    onDiscoverPress,
    onNotificationsPress,
    onSettingsPress,
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
