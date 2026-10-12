import React from "react";
import { DeviceOnboardingDebugView } from "./DeviceOnboardingDebugView";
import { useDeviceOnboardingDebugViewModel } from "./useDeviceOnboardingDebugViewModel";

export default function DeviceOnboardingDebug() {
  const viewModel = useDeviceOnboardingDebugViewModel();
  return <DeviceOnboardingDebugView {...viewModel} />;
}
