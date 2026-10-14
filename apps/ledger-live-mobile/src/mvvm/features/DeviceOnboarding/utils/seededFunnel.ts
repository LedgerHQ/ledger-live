export function isSeededDeviceFunnelOn(
  deviceOnboardingEnabled: boolean,
  connectSeededDevice: boolean,
): boolean {
  return deviceOnboardingEnabled && connectSeededDevice;
}
