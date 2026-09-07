import React from "react";
import { DeviceScreenView } from "./DeviceScreenView";
import { useDeviceScreenViewModel } from "./useDeviceScreenViewModel";

export function DeviceScreen() {
  const viewModel = useDeviceScreenViewModel();
  return <DeviceScreenView viewModel={viewModel} />;
}

export { useDeviceScreenViewModel } from "./useDeviceScreenViewModel";
export type { DeviceScreenViewModel } from "./types";
