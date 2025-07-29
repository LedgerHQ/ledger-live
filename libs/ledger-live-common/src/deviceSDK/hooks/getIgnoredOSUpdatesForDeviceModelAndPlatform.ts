import type { Feature_OnboardingIgnoredOSUpdates } from "@ledgerhq/types-live";
import type { DeviceModelId } from "@ledgerhq/types-devices";

export type Platform = "ios" | "android" | "macos" | "windows" | "linux";

/**
 * Extracts the ignored OS updates for a specific device model and platform from the configuration
 *
 * @param ignoredOSUpdatesConfig The configuration object containing ignored OS updates per platform and device model
 * @param deviceModelId The device model identifier
 * @param platform The platform to get updates for
 * @returns Array of firmware versions that should be ignored for the given device model and platform
 */
export const getIgnoredOSUpdatesForDeviceModelAndPlatform = (
  ignoredOSUpdatesConfig: Feature_OnboardingIgnoredOSUpdates["params"] | undefined,
  deviceModelId: DeviceModelId,
  platform: Platform,
): string[] => {
  if (!ignoredOSUpdatesConfig) return [];

  const configForPlatform = ignoredOSUpdatesConfig[platform];
  if (!configForPlatform) return [];

  return configForPlatform[deviceModelId] ?? [];
};
