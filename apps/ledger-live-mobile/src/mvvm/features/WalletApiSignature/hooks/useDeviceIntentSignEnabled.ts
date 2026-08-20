import { useMemo } from "react";
import { useFeature } from "@features/platform-feature-flags";

/**
 * The device-intent sign flow is opt-in per live-app: only enabled when the flag is on
 * and the given manifest id is in the configured allowlist.
 */
export function useDeviceIntentSignEnabled(manifestId: string): boolean {
  const deviceIntentSignFlag = useFeature("llmWalletApiDeviceIntentSign");
  const enabledManifestIds = useMemo(
    () => new Set(deviceIntentSignFlag?.params?.enabledManifestIds ?? []),
    [deviceIntentSignFlag?.params?.enabledManifestIds],
  );

  return (deviceIntentSignFlag?.enabled ?? false) && enabledManifestIds.has(manifestId);
}
