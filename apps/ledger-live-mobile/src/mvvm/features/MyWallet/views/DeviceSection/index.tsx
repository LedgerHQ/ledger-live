import React from "react";
import { useDeviceSectionViewModel } from "./useDeviceSectionViewModel";
import { DeviceSectionView } from "./DeviceSectionView";

export function DeviceSection() {
  const { devices, hasDevices, onAddDevice, onExploreDevices } = useDeviceSectionViewModel();

  return (
    <DeviceSectionView
      devices={devices}
      hasDevices={hasDevices}
      onAddDevice={onAddDevice}
      onExploreDevices={onExploreDevices}
    />
  );
}
