import { useMemo } from "react";
import { useFeature } from "@features/platform-feature-flags";
import type { DeviceIntentSignAssignment, WalletApiDeviceIntentSignFlagId } from "./types";

/**
 * The device-intent sign flow is opt-in per live-app: only enabled when the flag is on
 * and the given manifest id is in the configured allowlist.
 */
export function useWalletApiSignAssignment(
  flagId: WalletApiDeviceIntentSignFlagId,
  manifestId: string,
): DeviceIntentSignAssignment {
  const flag = useFeature(flagId);
  const enabledManifestIds = useMemo(
    () => new Set(flag?.params?.enabledManifestIds ?? []),
    [flag?.params?.enabledManifestIds],
  );
  const enabled = flag?.enabled ?? false;
  const variantId = flag?.params?.variantId;
  const active = enabled && enabledManifestIds.has(manifestId);

  return useMemo(() => ({ enabled, variantId, active }), [enabled, variantId, active]);
}

export function useWalletApiSignEnabled(
  flagId: WalletApiDeviceIntentSignFlagId,
  manifestId: string,
): boolean {
  return useWalletApiSignAssignment(flagId, manifestId).active;
}
