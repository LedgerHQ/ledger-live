export function isSeededDeviceFunnelOn(
  deviceOnboardingEnabled: boolean,
  connectSeededDevice: boolean,
): boolean {
  return deviceOnboardingEnabled && connectSeededDevice;
}

export function isUnseededDeviceFunnelOn(
  deviceOnboardingEnabled: boolean,
  connectUnseededDevice: boolean,
): boolean {
  return deviceOnboardingEnabled && connectUnseededDevice;
}
