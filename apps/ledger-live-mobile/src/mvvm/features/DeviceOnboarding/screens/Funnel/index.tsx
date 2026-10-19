import React from "react";
import { ChecksScreen } from "LLM/features/DeviceOnboarding/screens/Checks";
import { useDeviceOnboardingFunnelViewModel } from "./useDeviceOnboardingFunnelViewModel";

export function DeviceOnboardingFunnel() {
  const checks = useDeviceOnboardingFunnelViewModel();
  if (!checks) return null;
  return <ChecksScreen {...checks} />;
}
