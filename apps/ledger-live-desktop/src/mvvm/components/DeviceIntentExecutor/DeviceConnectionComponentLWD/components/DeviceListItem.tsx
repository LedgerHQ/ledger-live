import React from "react";
import {
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
  Spot,
  Tag,
} from "@ledgerhq/lumen-ui-react";
import type { DisplayedDevice } from "@ledgerhq/live-dmk-desktop";
import { getProductName } from "@ledgerhq/devices";
import { getDeviceIcon } from "LLD/utils/getDeviceIcon";
import { useTranslation } from "react-i18next";

type DeviceListItemProps = {
  device: DisplayedDevice;
};

function getDeviceName(device: DisplayedDevice["knownDevice"], fallbackName: string): string {
  return device.name ?? fallbackName;
}

export function DeviceListItem({ device }: Readonly<DeviceListItemProps>): React.ReactNode {
  const { t } = useTranslation();
  const DeviceIcon = getDeviceIcon(device.knownDevice.deviceModelId);
  const isAvailable = device.type === "available";

  return (
    <ListItem onClick={device.onSelect}>
      <ListItemLeading>
        <Spot size={48} appearance="icon" icon={DeviceIcon} />
        <ListItemContent>
          <ListItemTitle>
            {getDeviceName(device.knownDevice, getProductName(device.knownDevice.deviceModelId))}
          </ListItemTitle>
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>
        <Tag
          appearance={isAvailable ? "accent-subtle" : "gray"}
          label={t(
            isAvailable
              ? "deviceIntentExecutor.connectDevice.common.available"
              : "deviceIntentExecutor.connectDevice.common.notConnected",
          )}
          size="md"
        />
      </ListItemTrailing>
    </ListItem>
  );
}
