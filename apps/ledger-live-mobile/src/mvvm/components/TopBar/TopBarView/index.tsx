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
import { ICON_SIZE } from "LLM/components/TopBar/const";
import { SyncErrorBottomSheet } from "../components/SyncErrorBottomSheet";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { useTopBarViewModel } from "../useTopBarViewModel";

const syncIcon: IconButtonProps["icon"] = ({ size, style }) => (
  <Warning size={size ?? ICON_SIZE} style={style} color="base" />
);

type TopBarViewProps = ReturnType<typeof useTopBarViewModel>;

export function TopBarView({
  onMyLedgerPress,
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
}: Readonly<TopBarViewProps>) {
  const { shouldDisplayOperationsList } = useWalletFeaturesConfig("mobile");
  const myLedgerAction = useMyLedgerTopBarAction(onMyLedgerPress);

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

  const leadingIcons = shouldDisplayOperationsList
    ? [myLedgerAction, discoverIcon]
    : [myLedgerAction];

  const baseIcons = shouldDisplayOperationsList
    ? [notificationsIcon, transactionHistoryIcon, settingsIcon]
    : [discoverIcon, notificationsIcon, settingsIcon];

  const trailingIcons = hasAccounts && isSyncError ? [syncStatusIcon, ...baseIcons] : baseIcons;

  return (
    <>
      <CustomTopBar leadingIcons={leadingIcons} trailingIcons={trailingIcons} />

      <SyncErrorBottomSheet
        isOpen={isSyncDrawerOpen}
        onClose={closeSyncDrawer}
        listOfErrorAccountNames={listOfErrorAccountNames}
      />
    </>
  );
}
