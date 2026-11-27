import { useMemo } from "react";
import { useFeature } from "@features/platform-feature-flags";

export type DeviceIntentSignAssignment = {
  enabled: boolean;
  variantId: string | undefined;
  active: boolean;
};

/**
 * The device-intent sign flow is opt-in per live-app: only enabled when the flag is on
 * and the given manifest id is in the configured allowlist.
 */
export function useDeviceIntentSignAssignment(manifestId: string): DeviceIntentSignAssignment {
  const deviceIntentSignFlag = useFeature("llmWalletApiDeviceIntentSign");
  const enabledManifestIds = useMemo(
    () => new Set(deviceIntentSignFlag?.params?.enabledManifestIds ?? []),
    [deviceIntentSignFlag?.params?.enabledManifestIds],
  );
  const enabled = deviceIntentSignFlag?.enabled ?? false;

  return {
    enabled,
    variantId: deviceIntentSignFlag?.params?.variantId,
    active: enabled && enabledManifestIds.has(manifestId),
  };
}

export function useDeviceIntentSignEnabled(manifestId: string): boolean {
  return useDeviceIntentSignAssignment(manifestId).active;
}

/** Whether the device-intent sign drawer lets the user edit fees for the given live-app. */
export function useDeviceIntentFeeSelectionEnabled(manifestId: string): boolean {
  const deviceIntentSignFlag = useFeature("llmWalletApiDeviceIntentSign");
  const feeSelectionManifestIds = deviceIntentSignFlag?.params?.feeSelectionManifestIds;
  return (
    (deviceIntentSignFlag?.enabled ?? false) && (feeSelectionManifestIds ?? []).includes(manifestId)
  );
}
