import React, { useCallback, useMemo } from "react";
import { IconButton } from "@ledgerhq/lumen-ui-rnative";
import {
  Compass,
  Bell,
  BellNotification,
  Settings,
  Warning,
} from "@ledgerhq/lumen-ui-rnative/symbols";
import { CustomTopBar, TopBarActionIcon } from "LLM/components/CustomTopBar";
import { ICON_SIZE } from "LLM/components/TopBar/const";
import { SyncErrorBottomSheet } from "../components/SyncErrorBottomSheet";

type TopBarViewProps = {
  onMyLedgerPress: () => void;
  onDiscoverPress: () => void;
  onNotificationsPress: () => void;
  onSettingsPress: () => void;
  hasUnreadNotifications: boolean;
  hasAccounts: boolean;
  isSyncError: boolean;
  isSyncPending: boolean;
  listOfErrorAccountNames: string;
  syncAccessibilityLabel: string;
  isSyncDrawerOpen: boolean;
  openSyncDrawer: () => void;
  closeSyncDrawer: () => void;
};

export function TopBarView({
  onMyLedgerPress,
  onDiscoverPress,
  onNotificationsPress,
  onSettingsPress,
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
  const notificationIcon = useCallback<
    NonNullable<React.ComponentProps<typeof IconButton>["icon"]>
  >(
    ({ size, style }) => {
      const Icon = hasUnreadNotifications ? BellNotification : Bell;
      return <Icon size={size ?? ICON_SIZE} style={style} color="base" />;
    },
    [hasUnreadNotifications],
  );

  const syncIcon = useCallback<NonNullable<React.ComponentProps<typeof IconButton>["icon"]>>(
    ({ size, style }) => <Warning size={size ?? ICON_SIZE} style={style} color="base" />,
    [],
  );

  const baseIcons = useMemo<TopBarActionIcon[]>(
    () => [
      {
        id: "discover",
        icon: Compass,
        callback: onDiscoverPress,
        testID: "topbar-discover",
        accessibilityLabel: "Discover",
      },
      {
        id: "notifications",
        icon: notificationIcon,
        callback: onNotificationsPress,
        testID: "topbar-notifications",
        accessibilityLabel: "Notifications",
      },
      {
        id: "settings",
        icon: Settings,
        callback: onSettingsPress,
        testID: "topbar-settings",
        accessibilityLabel: "Settings",
      },
    ],
    [notificationIcon, onDiscoverPress, onNotificationsPress, onSettingsPress],
  );

  const customIcons = useMemo(() => {
    const shouldShowSyncStatus = hasAccounts && isSyncError;

    if (!shouldShowSyncStatus) {
      return baseIcons;
    }

    const syncStatusIcon: TopBarActionIcon = {
      id: "sync",
      icon: syncIcon,
      callback: openSyncDrawer,
      testID: "topbar-sync",
      accessibilityLabel: syncAccessibilityLabel,
      loading: isSyncPending,
    };

    return [syncStatusIcon, ...baseIcons];
  }, [
    hasAccounts,
    isSyncError,
    syncIcon,
    openSyncDrawer,
    syncAccessibilityLabel,
    isSyncPending,
    baseIcons,
  ]);

  return (
    <>
      <CustomTopBar onMyLedgerPress={onMyLedgerPress} customIcons={customIcons} />

      <SyncErrorBottomSheet
        isOpen={isSyncDrawerOpen}
        onClose={closeSyncDrawer}
        listOfErrorAccountNames={listOfErrorAccountNames}
      />
    </>
  );
}
