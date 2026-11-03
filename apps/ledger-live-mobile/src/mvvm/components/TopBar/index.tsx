import React from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTopBarViewModel } from "./useTopBarViewModel";
import { TopBarView } from "./TopBarView";

type TopBarProps = {
  screenName?: string;
};

export function TopBar({ screenName }: Readonly<TopBarProps>) {
  const navigation =
    useNavigation<NativeStackNavigationProp<{ [key: string]: object | undefined }>>();
  const {
    onMyWalletPress,
    shouldDisplayOperationsList,
    shouldDisplayAssetDiscoverability,
    onSearchPress,
    onDiscoverPress,
    onTransactionHistoryPress,
    hasUnreadNotifications,
    hasUnreadOperations,
    hasAccounts,
    isSyncError,
    isSyncPending,
    listOfErrorAccountNames,
    syncAccessibilityLabel,
    isSyncDrawerOpen,
    openSyncDrawer,
    closeSyncDrawer,
    onTryRefresh,
  } = useTopBarViewModel(navigation, screenName);

  return (
    <TopBarView
      onMyWalletPress={onMyWalletPress}
      shouldDisplayOperationsList={shouldDisplayOperationsList}
      shouldDisplayAssetDiscoverability={shouldDisplayAssetDiscoverability}
      onSearchPress={onSearchPress}
      onDiscoverPress={onDiscoverPress}
      onTransactionHistoryPress={onTransactionHistoryPress}
      hasUnreadNotifications={hasUnreadNotifications}
      hasUnreadOperations={hasUnreadOperations}
      hasAccounts={hasAccounts}
      isSyncError={isSyncError}
      isSyncPending={isSyncPending}
      listOfErrorAccountNames={listOfErrorAccountNames}
      syncAccessibilityLabel={syncAccessibilityLabel}
      isSyncDrawerOpen={isSyncDrawerOpen}
      openSyncDrawer={openSyncDrawer}
      closeSyncDrawer={closeSyncDrawer}
      onTryRefresh={onTryRefresh}
    />
  );
}
