import React from "react";
import { useDeviceSectionViewModel } from "./useDeviceSectionViewModel";
import { DeviceSectionView } from "./DeviceSectionView";

export function DeviceSection() {
  const {
    devices,
    hasDevices,
    onAddDevice,
    onExploreDevices,
    onDevicePress,
    selectedDevice,
    isRemoveDrawerOpen,
    onOpenRemoveMenu,
    onCloseRemoveMenu,
    onRemoveDevice,
  } = useDeviceSectionViewModel();

  return (
    <DeviceSectionView
      devices={devices}
      hasDevices={hasDevices}
      onAddDevice={onAddDevice}
      onExploreDevices={onExploreDevices}
      onDevicePress={onDevicePress}
      onOpenMenu={onOpenRemoveMenu}
      selectedDevice={selectedDevice}
      isRemoveDrawerOpen={isRemoveDrawerOpen}
      onCloseRemoveMenu={onCloseRemoveMenu}
      onRemoveDevice={onRemoveDevice}
    />
  );
}
