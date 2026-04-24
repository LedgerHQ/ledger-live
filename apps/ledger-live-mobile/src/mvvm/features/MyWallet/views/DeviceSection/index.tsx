import React from "react";
import { useDeviceSectionViewModel } from "./useDeviceSectionViewModel";
import { DeviceSectionView } from "./DeviceSectionView";

export function DeviceSection() {
  const vm = useDeviceSectionViewModel();

  return (
    <DeviceSectionView
      devices={vm.devices}
      hasDevices={vm.hasDevices}
      onAddDevice={vm.onAddDevice}
      onExploreDevices={vm.onExploreDevices}
      onDevicePress={vm.onDevicePress}
      onOpenMenu={vm.onOpenRemoveMenu}
      deviceToRemove={vm.deviceToRemove}
      isRemoveDrawerOpen={vm.isRemoveDrawerOpen}
      onCloseRemoveMenu={vm.onCloseRemoveMenu}
      onRemoveDevice={vm.onRemoveDevice}
      selectedDevice={vm.selectedDevice}
      managerAction={vm.managerAction}
      onDeviceActionResult={vm.onDeviceActionResult}
      onDeviceActionClose={vm.onDeviceActionClose}
      onDeviceActionError={vm.onDeviceActionError}
    />
  );
}
