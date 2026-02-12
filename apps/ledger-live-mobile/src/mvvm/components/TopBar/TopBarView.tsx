import React, { useCallback } from "react";
import { Box, IconButton } from "@ledgerhq/lumen-ui-rnative";
import { type LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import {
  Stax,
  Compass,
  Bell,
  BellNotification,
  Settings,
  Apex,
  Flex,
  Nano,
} from "@ledgerhq/lumen-ui-rnative/symbols";
import { lastConnectedDeviceSelector } from "~/reducers/settings";
import { useSelector } from "~/context/hooks";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { ICON_SIZE } from "./const";

type TopBarViewProps = {
  onMyLedgerPress: () => void;
  onDiscoverPress: () => void;
  onNotificationsPress: () => void;
  onSettingsPress: () => void;
  hasUnreadNotifications: boolean;
};

type IconComponent = NonNullable<React.ComponentProps<typeof IconButton>["icon"]>;

export function TopBarView({
  onMyLedgerPress,
  onDiscoverPress,
  onNotificationsPress,
  onSettingsPress,
  hasUnreadNotifications,
}: Readonly<TopBarViewProps>) {
  const lastConnectedDevice = useSelector(lastConnectedDeviceSelector);

  const deviceIcon: IconComponent = useCallback(
    ({ size, style }) => {
      switch (lastConnectedDevice?.modelId) {
        case DeviceModelId.nanoS:
        case DeviceModelId.nanoSP:
        case DeviceModelId.nanoX:
          return <Nano size={size ?? ICON_SIZE} style={style} color="base" />;
        case DeviceModelId.europa:
          return <Flex size={size ?? ICON_SIZE} style={style} color="base" />;
        case DeviceModelId.apex:
          return <Apex size={size ?? ICON_SIZE} style={style} color="base" />;
        case DeviceModelId.stax:
        default:
          return <Stax size={size ?? ICON_SIZE} style={style} color="base" />;
      }
    },
    [lastConnectedDevice?.modelId],
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
