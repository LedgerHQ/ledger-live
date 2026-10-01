import { track } from "@shared/analytics";
import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { NavigatorName, ScreenName } from "~/const";
import { useTopBarViewModel } from "LLM/components/TopBar/useTopBarViewModel";

export function useSwapTopBarHeaderViewModel() {
  const navigation =
    useNavigation<NativeStackNavigationProp<{ [key: string]: object | undefined }>>();
  const {
    closeSyncDrawer,
    hasAccounts,
    hasUnreadNotifications,
    isSyncDrawerOpen,
    isSyncError,
    isSyncPending,
    listOfErrorAccountNames,
    onMyLedgerPress,
    onMyWalletPress,
    onTryRefresh,
    openSyncDrawer,
    shouldDisplayMyWallet,
    syncAccessibilityLabel,
  } = useTopBarViewModel(navigation, ScreenName.SwapTab);

  const onSwapHistoryPress = useCallback(() => {
    track("button_clicked", { button: "SwapHistory", page: "Swap" });
    navigation.navigate(NavigatorName.SwapSubScreens, {
      screen: ScreenName.SwapHistory,
    });
  }, [navigation]);

  return {
    closeSyncDrawer,
    hasAccounts,
    hasUnreadNotifications,
    isSyncDrawerOpen,
    isSyncError,
    isSyncPending,
    listOfErrorAccountNames,
    onMyLedgerPress,
    onMyWalletPress,
    onSwapHistoryPress,
    onTryRefresh,
    openSyncDrawer,
    shouldDisplayMyWallet,
    syncAccessibilityLabel,
  };
}
