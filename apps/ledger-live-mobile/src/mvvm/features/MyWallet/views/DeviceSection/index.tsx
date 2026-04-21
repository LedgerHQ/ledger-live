import React from "react";
import { useDeviceSectionViewModel } from "./useDeviceSectionViewModel";
import { DeviceSectionView } from "./DeviceSectionView";

export function DeviceSection() {
  const { devices, hasDevices, onAddDevice } = useDeviceSectionViewModel();

  return <DeviceSectionView devices={devices} hasDevices={hasDevices} onAddDevice={onAddDevice} />;
}
