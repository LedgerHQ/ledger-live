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
import { useDeviceIntentTracking } from "@ledgerhq/live-dmk-shared";
import { getProductName } from "@ledgerhq/devices";
import { getDeviceIcon } from "LLD/utils/getDeviceIcon";
import { useTranslation } from "react-i18next";
import { trackDeviceSelected } from "../../utils/trackDeviceIntent";

type DeviceListItemProps = {
  device: DisplayedDevice;
};

function getDeviceName(device: DisplayedDevice["knownDevice"], fallbackName: string): string {
  return device.name ?? fallbackName;
}

export function DeviceListItem({ device }: Readonly<DeviceListItemProps>): React.ReactNode {
  const { t } = useTranslation();
  const { sourceFlow, analyticsProperties } = useDeviceIntentTracking();
  const DeviceIcon = getDeviceIcon(device.knownDevice.deviceModelId);
  const isAvailable = device.type === "available";
  const handleSelect = () => {
    trackDeviceSelected({
      sourceFlow,
      device: device.knownDevice,
      extraProperties: analyticsProperties,
    });
    device.onSelect();
  };

  return (
    <ListItem onClick={handleSelect}>
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
