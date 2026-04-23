import React, { useCallback } from "react";
import type { IconButtonProps } from "@ledgerhq/lumen-ui-rnative";
import {
  Compass,
  Bell,
  BellNotification,
  Settings,
  Warning,
  Clock,
} from "@ledgerhq/lumen-ui-rnative/symbols";
import {
  CustomTopBar,
  TopBarActionIcon,
  useMyLedgerTopBarAction,
} from "LLM/components/CustomTopBar";
import { useMyWalletTopBarAction } from "LLM/features/MyWallet/useMyWalletTopBarAction";
import { ICON_SIZE } from "LLM/components/TopBar/const";
import { SyncErrorBottomSheet } from "../components/SyncErrorBottomSheet";
import { useTopBarViewModel } from "../useTopBarViewModel";

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
  onDiscoverPress,
  onNotificationsPress,
  onSettingsPress,
  onTransactionHistoryPress,
  hasUnreadNotifications,
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
  const myWalletAction = useMyWalletTopBarAction(onMyWalletPress);
  const leadingAction = shouldDisplayMyWallet ? myWalletAction : myLedgerAction;

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

  const notificationsIcon: TopBarActionIcon = {
    id: "notifications",
    icon: notificationIcon,
    callback: onNotificationsPress,
    testID: "topbar-notifications",
    accessibilityLabel: "Notifications",
  };

  const transactionHistoryIcon: TopBarActionIcon = {
    id: "transaction-history",
    icon: Clock,
    callback: onTransactionHistoryPress,
    testID: "topbar-transaction-history",
    accessibilityLabel: "Transaction History",
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

  const getLeadingIcons = (): TopBarActionIcon[] =>
    filterIcons([leadingAction, shouldDisplayOperationsList && discoverIcon]);

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
      <CustomTopBar leadingIcons={getLeadingIcons()} trailingIcons={getTrailingIcons()} />

      <SyncErrorBottomSheet
        isOpen={isSyncDrawerOpen}
        onClose={closeSyncDrawer}
        listOfErrorAccountNames={listOfErrorAccountNames}
        onTryRefresh={onTryRefresh}
      />
    </>
  );
}
