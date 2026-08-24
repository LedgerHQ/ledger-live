import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { LNUpsellBanner } from "LLM/features/LNUpsell";
import { type DeviceSectionDevice } from "../useDeviceSectionViewModel";
import { AddDeviceItem } from "./AddDeviceItem";
import { DeviceListItem } from "./DeviceListItem";
import { ExploreDevicesItem } from "./ExploreDevicesItem";

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
  const profileUpsell = <LNUpsellBanner location="profile" />;

  if (devices.length === 0) {
    return (
      <>
        <AddDeviceItem onPress={onAddDevice} />
        {profileUpsell}
      </>
    );
  }

  return (
    <>
      <Box lx={{ backgroundColor: "surface", borderRadius: "md", paddingVertical: "s4" }}>
        {devices.map(device => (
          <DeviceListItem
            key={device.id}
            device={device}
            onPress={onDevicePress}
            onOpenMenu={onOpenMenu}
          />
        ))}
      </Box>
      {profileUpsell}
      <ExploreDevicesItem onPress={onExploreDevices} />
    </>
  );
}
