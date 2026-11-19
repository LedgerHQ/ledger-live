import React from "react";
import { getDeviceModel } from "@ledgerhq/devices";
import {
  Box,
  Button,
  ListItem,
  ListItemContent,
  ListItemTitle,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { PlusCircleFill } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { DeviceListItem, SelectableDeviceListItem } from "@ledgerhq/live-dmk-mobile";
import { useTranslation } from "~/context/Locale";

type DeviceSectionProps = {
  /** Only the rows of `Discovering` are selectable. */
  devices: Array<DeviceListItem | SelectableDeviceListItem>;
  /** Only set in `Discovering`. */
  onAddNewDevice?: () => void;
  children?: React.ReactNode;
};

const isSelectable = (
  item: DeviceListItem | SelectableDeviceListItem,
): item is SelectableDeviceListItem => "connect" in item;

function DeviceRow({ item }: Readonly<{ item: DeviceListItem | SelectableDeviceListItem }>) {
  const { device } = item;

  return (
    <ListItem
      onPress={isSelectable(item) ? item.connect : undefined}
      testID={`connect-known-or-new-device-row-${item.key}`}
    >
      <ListItemContent>
        <ListItemTitle>
          {device.name ?? getDeviceModel(device.deviceModelId).productName}
        </ListItemTitle>
      </ListItemContent>
    </ListItem>
  );
}

export function DeviceSection({
  devices,
  onAddNewDevice,
  children,
}: Readonly<DeviceSectionProps>): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <Box lx={{ gap: "s16" }}>
      <Box lx={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text typography="heading4SemiBold" lx={{ color: "base" }}>
          {t("connectKnownOrNewDevice.title")}
        </Text>
        <Button
          appearance="no-background"
          size="sm"
          icon={PlusCircleFill}
          disabled={!onAddNewDevice}
          onPress={onAddNewDevice}
        >
          {t("connectKnownOrNewDevice.add")}
        </Button>
      </Box>
      <Box>
        {devices.map(item => (
          <DeviceRow key={item.key} item={item} />
        ))}
      </Box>
      {children}
    </Box>
  );
}
