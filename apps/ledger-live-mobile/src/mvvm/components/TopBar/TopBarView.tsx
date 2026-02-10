import React, { useCallback } from "react";
import { Box, IconButton } from "@ledgerhq/lumen-ui-rnative";
import { type LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { Compass, Bell, BellNotification, Settings } from "@ledgerhq/lumen-ui-rnative/symbols";
import { lastConnectedDeviceSelector } from "~/reducers/settings";
import { useSelector } from "~/context/hooks";
import { ICON_SIZE } from "./const";
import { getDeviceIcon, IconComponent } from "LLM/utils/getDeviceIcon";

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
  const lastConnectedDevice = useSelector(lastConnectedDeviceSelector);

  const deviceIcon: IconComponent = useCallback(
    ({ size, style }) => getDeviceIcon(lastConnectedDevice, size, style),
    [lastConnectedDevice],
  );

  const notificationIcon: IconComponent = useCallback(
    ({ size, style }) => {
      return hasUnreadNotifications ? (
        <BellNotification size={size ?? ICON_SIZE} style={style} color="base" />
      ) : (
        <Bell size={size ?? ICON_SIZE} style={style} color="base" />
      );
    },
    [hasUnreadNotifications],
  );

  return (
    <Box lx={rowLx}>
      <IconButton
        onPress={onMyLedgerPress}
        testID="topbar-myledger"
        accessibilityLabel="My Ledger"
        appearance="transparent"
        icon={deviceIcon}
        size="md"
      />

      <Box lx={rightGroupLx}>
        <IconButton
          onPress={onDiscoverPress}
          testID="topbar-discover"
          accessibilityLabel="Discover"
          appearance="transparent"
          icon={Compass}
          size="md"
        />
        <IconButton
          onPress={onNotificationsPress}
          testID="topbar-notifications"
          accessibilityLabel="Notifications"
          appearance="transparent"
          icon={notificationIcon}
          size="md"
        />
        <IconButton
          onPress={onSettingsPress}
          testID="topbar-settings"
          accessibilityLabel="Settings"
          appearance="transparent"
          icon={Settings}
          size="md"
        />
      </Box>
    </Box>
  );
}

const rowLx: LumenViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  width: "full",
  justifyContent: "space-between",
};

const rightGroupLx: LumenViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: "s8",
};
