import React from "react";
import { getDeviceModel } from "@ledgerhq/devices";
import {
  Box,
  IconButton,
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
} from "@ledgerhq/lumen-ui-rnative";
import { MoreVertical } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { DeviceListItem, SelectableDeviceListItem } from "@ledgerhq/live-dmk-mobile";
import { useTranslation } from "~/context/Locale";
import { DevicePackshot } from "./DevicePackshot";
import { DeviceStatusTag } from "./DeviceStatusTag";

export type DeviceRowItem = DeviceListItem | SelectableDeviceListItem;

export const isSelectable = (item: DeviceRowItem): item is SelectableDeviceListItem =>
  "connect" in item;

export const hasMenuActions = (item: DeviceRowItem): item is SelectableDeviceListItem =>
  isSelectable(item) && ("disconnect" in item || item.remove !== undefined);

export const getDeviceName = ({ device }: DeviceRowItem): string =>
  device.name ?? getDeviceModel(device.deviceModelId).productName;

type DeviceRowProps = {
  item: DeviceRowItem;
  onOpenMenu: () => void;
};

export function DeviceRow({ item, onOpenMenu }: Readonly<DeviceRowProps>): React.JSX.Element {
  const { t } = useTranslation();
  const deviceName = getDeviceName(item);

  return (
    <ListItem
      density="expanded"
      onPress={isSelectable(item) ? item.connect : undefined}
      testID={`connect-known-or-new-device-row-${item.key}`}
    >
      <ListItemLeading>
        <DevicePackshot deviceModelId={item.device.deviceModelId} />
        <ListItemContent lx={{ gap: "s4" }}>
          <ListItemTitle>{deviceName}</ListItemTitle>
          <Box lx={{ alignSelf: "flex-start" }}>
            <DeviceStatusTag status={item.status} />
          </Box>
        </ListItemContent>
      </ListItemLeading>
      {hasMenuActions(item) && (
        <ListItemTrailing>
          <IconButton
            appearance="no-background"
            size="sm"
            icon={MoreVertical}
            accessibilityLabel={t("connectKnownOrNewDevice.menu.accessibilityLabel", {
              deviceName,
            })}
            onPress={onOpenMenu}
            testID={`connect-known-or-new-device-menu-${item.key}`}
          />
        </ListItemTrailing>
      )}
    </ListItem>
  );
}
