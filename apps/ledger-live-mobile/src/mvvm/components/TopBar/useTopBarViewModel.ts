import { useCallback, useMemo, useState } from "react";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { NavigatorName, ScreenName } from "~/const";
import useDynamicContent from "~/dynamicContent/useDynamicContent";
import { track } from "~/analytics";
import { setOriginFlow } from "~/analytics/originFlow";
import { HOOKS_TRACKING_LOCATIONS } from "~/analytics/hooks/variables";
import { useSelector } from "~/context/hooks";
import { readOnlyModeEnabledSelector } from "~/reducers/settings";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { useRebornFlow } from "LLM/features/Reborn/hooks/useRebornFlow";
import { useSyncIndicator } from "./hooks/useSyncIndicator";

export function useTopBarViewModel(
  navigation: NativeStackNavigationProp<{ [key: string]: object | undefined }>,
  screenName?: string,
) {
  const { notificationCards } = useDynamicContent();
  const web3hub = useFeature("web3hub");
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
  const [isSyncDrawerOpen, setIsSyncDrawerOpen] = useState(false);
  const openSyncDrawer = useCallback(() => {
    setIsSyncDrawerOpen(true);
    track("SyncErrorList", {
      currencies: errorCurrencyIds,
      page,
    });
  }, [errorCurrencyIds, page]);
  const closeSyncDrawer = useCallback(() => setIsSyncDrawerOpen(false), []);

  const hasUnreadNotifications = useMemo(
    () => notificationCards.some(n => !n.viewed),
    [notificationCards],
  );

  const onMyLedgerPress = useCallback(() => {
    track("menuentry_clicked", { button: "MyLedger", page });
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

  const onDiscoverPress = useCallback(() => {
    track("menuentry_clicked", { button: "Discover", page });
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
    track("menuentry_clicked", { button: "Notifications", page });
    navigation.navigate(NavigatorName.NotificationCenter, {
      screen: ScreenName.NotificationCenter,
    });
  }, [navigation, page]);

  const onSettingsPress = useCallback(() => {
    track("menuentry_clicked", { button: "Settings" });
    navigation.navigate(NavigatorName.Settings);
  }, [navigation]);

  return {
    onMyLedgerPress,
    onDiscoverPress,
    onNotificationsPress,
    onSettingsPress,
    hasUnreadNotifications,
    hasAccounts,
    isSyncError: isError,
    isSyncPending: isPending,
    listOfErrorAccountNames,
    syncAccessibilityLabel,
    isSyncDrawerOpen,
    openSyncDrawer,
    closeSyncDrawer,
  };
}
