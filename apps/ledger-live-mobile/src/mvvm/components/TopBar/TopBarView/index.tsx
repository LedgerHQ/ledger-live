import React, { useCallback, useMemo } from "react";
import type { IconButtonProps } from "@ledgerhq/lumen-ui-rnative";
import { DotIndicator } from "@ledgerhq/lumen-ui-rnative";
import {
  Compass,
  Bell,
  BellNotification,
  Settings,
  Warning,
  Clock,
  Search,
} from "@ledgerhq/lumen-ui-rnative/symbols";
import {
  CustomTopBar,
  type TopBarActionIcon,
  useMyLedgerTopBarAction,
} from "LLM/components/CustomTopBar";
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
  onMyLedgerPress,
  onMyWalletPress,
  shouldDisplayMyWallet,
  shouldDisplayOperationsList,
  shouldDisplayAssetDiscoverability,
  onSearchPress,
  onDiscoverPress,
  onNotificationsPress,
  onSettingsPress,
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
  const myLedgerAction = useMyLedgerTopBarAction(onMyLedgerPress);

  const leadingElement = shouldDisplayMyWallet ? (
    <MyWalletTopBarAction onPress={onMyWalletPress} showNotification={hasUnreadNotifications} />
  ) : undefined;

  const notificationIcon = useCallback<IconButtonProps["icon"]>(
    ({ size, style }) => {
      const Icon = hasUnreadNotifications ? BellNotification : Bell;
      return <Icon size={size ?? ICON_SIZE} style={style} color="base" />;
    },
    [hasUnreadNotifications],
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

  const notificationsIcon: TopBarActionIcon = {
    id: "notifications",
    icon: notificationIcon,
    callback: onNotificationsPress,
    testID: "topbar-notifications",
    accessibilityLabel: "Notifications",
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

  const settingsIcon: TopBarActionIcon = {
    id: "settings",
    icon: Settings,
    callback: onSettingsPress,
    testID: "topbar-settings",
    accessibilityLabel: "Settings",
  };

  const syncStatusIcon: TopBarActionIcon = {
    id: "sync",
    icon: syncIcon,
    callback: openSyncDrawer,
    testID: "topbar-sync",
    accessibilityLabel: syncAccessibilityLabel,
    loading: isSyncPending,
  };

  const displayMyLedgerIconLeading = !shouldDisplayMyWallet;
  const displayDiscoverIconLeading = shouldDisplayOperationsList;

  const getLeadingIcons = (): TopBarActionIcon[] =>
    filterIcons([
      displayMyLedgerIconLeading && myLedgerAction,
      displayDiscoverIconLeading && discoverIcon,
      shouldDisplayAssetDiscoverability && searchIcon,
    ]);

  const displaySyncStatusIcon = hasAccounts && isSyncError;
  const displayDiscoverIcon = !shouldDisplayOperationsList;
  const displayNotificationsIcon = !shouldDisplayMyWallet;
  const displayTransactionHistoryIcon = shouldDisplayOperationsList;
  const displaySettingsIcon = !shouldDisplayMyWallet;

  const getTrailingIcons = (): TopBarActionIcon[] =>
    filterIcons([
      displaySyncStatusIcon && syncStatusIcon,
      displayDiscoverIcon && discoverIcon,
      displayNotificationsIcon && notificationsIcon,
      displayTransactionHistoryIcon && transactionHistoryIcon,
      displaySettingsIcon && settingsIcon,
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
