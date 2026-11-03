import React, { useMemo } from "react";
import type { IconButtonProps } from "@ledgerhq/lumen-ui-rnative";
import { DotIndicator } from "@ledgerhq/lumen-ui-rnative";
import { Compass, Warning, Clock, Search } from "@ledgerhq/lumen-ui-rnative/symbols";
import { CustomTopBar, type TopBarActionIcon } from "LLM/components/CustomTopBar";
import { ICON_SIZE } from "LLM/components/TopBar/const";
import { SyncErrorBottomSheet } from "../components/SyncErrorBottomSheet";
import { useTopBarViewModel } from "../useTopBarViewModel";
import { MyWalletTopBarAction } from "../components/MyWalletTopBarAction";

const syncIcon: IconButtonProps["icon"] = ({ size, style }) => (
  <Warning size={size ?? ICON_SIZE} style={style} color="base" />
);

const filterIcons = (icons: (TopBarActionIcon | false)[]): TopBarActionIcon[] =>
  icons.filter((icon): icon is TopBarActionIcon => Boolean(icon));

type TopBarViewProps = ReturnType<typeof useTopBarViewModel>;

export function TopBarView({
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
}: Readonly<TopBarViewProps>) {
  const leadingElement = (
    <MyWalletTopBarAction onPress={onMyWalletPress} showNotification={hasUnreadNotifications} />
  );

  const discoverIcon: TopBarActionIcon = {
    id: "discover",
    icon: Compass,
    callback: onDiscoverPress,
    testID: "topbar-discover",
    accessibilityLabel: "Discover",
  };

  const searchIcon: TopBarActionIcon = {
    id: "search",
    icon: Search,
    callback: onSearchPress,
    testID: "topbar-search",
    accessibilityLabel: "Search",
  };

  const unreadWrapper = useMemo(
    () =>
      hasUnreadOperations
        ? (children: React.ReactElement) => (
            <DotIndicator appearance="base" size="xl" testID="unread-indicator">
              {children}
            </DotIndicator>
          )
        : undefined,
    [hasUnreadOperations],
  );

  const transactionHistoryIcon: TopBarActionIcon = {
    id: "transaction-history",
    icon: Clock,
    callback: onTransactionHistoryPress,
    testID: "topbar-transaction-history",
    accessibilityLabel: "Transaction History",
    wrapper: unreadWrapper,
  };

  const syncStatusIcon: TopBarActionIcon = {
    id: "sync",
    icon: syncIcon,
    callback: openSyncDrawer,
    testID: "topbar-sync",
    accessibilityLabel: syncAccessibilityLabel,
    loading: isSyncPending,
  };

  const getLeadingIcons = (): TopBarActionIcon[] =>
    filterIcons([
      shouldDisplayOperationsList && discoverIcon,
      shouldDisplayAssetDiscoverability && searchIcon,
    ]);

  const displaySyncStatusIcon = hasAccounts && isSyncError;

  const getTrailingIcons = (): TopBarActionIcon[] =>
    filterIcons([
      displaySyncStatusIcon && syncStatusIcon,
      !shouldDisplayOperationsList && discoverIcon,
      shouldDisplayOperationsList && transactionHistoryIcon,
    ]);

  return (
    <>
      <CustomTopBar
        leadingElement={leadingElement}
        leadingIcons={getLeadingIcons()}
        trailingIcons={getTrailingIcons()}
      />

      <SyncErrorBottomSheet
        isOpen={isSyncDrawerOpen}
        onClose={closeSyncDrawer}
        listOfErrorAccountNames={listOfErrorAccountNames}
        onTryRefresh={onTryRefresh}
      />
    </>
  );
}
