import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { type DeviceSectionDevice } from "../useDeviceSectionViewModel";
import { DeviceListItem } from "./DeviceListItem";
import { ExploreDevicesItem } from "./ExploreDevicesItem";
import { AddDeviceItem } from "./AddDeviceItem";

type DeviceListContentProps = {
  readonly devices: readonly DeviceSectionDevice[];
  readonly onAddDevice: () => void;
  readonly onExploreDevices: () => void;
  readonly onDevicePress: (device: DeviceSectionDevice) => void;
  readonly onOpenMenu: (device: DeviceSectionDevice) => void;
};

export function DeviceListContent({
  devices,
  onAddDevice,
  onExploreDevices,
  onDevicePress,
  onOpenMenu,
}: DeviceListContentProps) {
  if (devices.length === 0) {
    return <AddDeviceItem onPress={onAddDevice} />;
  }

  return (
    <>
      <Box lx={{ backgroundColor: "surface", borderRadius: "md" }}>
        {devices.map(device => (
          <DeviceListItem key={device.id} device={device} onPress={onDevicePress} onOpenMenu={onOpenMenu} />
        ))}
      </Box>
      <ExploreDevicesItem onPress={onExploreDevices} />
    </>
  );
}
