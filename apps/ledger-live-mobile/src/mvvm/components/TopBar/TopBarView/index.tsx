import React, { useCallback, useMemo } from "react";
import { IconButton } from "@ledgerhq/lumen-ui-rnative";
import { Compass, Bell, BellNotification, Settings } from "@ledgerhq/lumen-ui-rnative/symbols";
import { CustomTopBar, TopBarActionIcon } from "LLM/components/CustomTopBar";
import { ICON_SIZE } from "LLM/components/TopBar/const";

type TopBarViewProps = {
  onMyLedgerPress: () => void;
  onDiscoverPress: () => void;
  onNotificationsPress: () => void;
  onSettingsPress: () => void;
  hasUnreadNotifications: boolean;
};

export function TopBarView({
  onMyLedgerPress,
  onDiscoverPress,
  onNotificationsPress,
  onSettingsPress,
  hasUnreadNotifications,
}: Readonly<TopBarViewProps>) {
  const notificationIcon: NonNullable<React.ComponentProps<typeof IconButton>["icon"]> =
    useCallback(
      ({ size, style }) =>
        hasUnreadNotifications ? (
          <BellNotification size={size ?? ICON_SIZE} style={style} color="base" />
        ) : (
          <Bell size={size ?? ICON_SIZE} style={style} color="base" />
        ),
      [hasUnreadNotifications],
    );

  const customIcons: readonly TopBarActionIcon[] = useMemo(
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
    [onDiscoverPress, onNotificationsPress, onSettingsPress, notificationIcon],
  );

  return <CustomTopBar onMyLedgerPress={onMyLedgerPress} customIcons={customIcons} />;
}
