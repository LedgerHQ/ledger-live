import React from "react";
import { useDeviceSectionViewModel } from "./useDeviceSectionViewModel";
import { DeviceSectionView } from "./DeviceSectionView";

export function DeviceSection() {
  const { devices } = useDeviceSectionViewModel();

  return <DeviceSectionView devices={devices} />;
}
