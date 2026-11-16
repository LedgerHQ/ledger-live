import { useMemo } from "react";
import { useFeature } from "@features/platform-feature-flags";

/** Matches every live app in the flag's allowlist. */
const ALL_MANIFESTS = "*";

export type DeviceIntentExchangeAssignment = {
  /** The flag itself is on, for any live app. */
  enabled: boolean;
  /** The A/B test variant the user is in. */
  variantId: string | undefined;
  /** The flag is on and the given live app is allowed to use the device intent exchange flow. */
  active: boolean;
};

/**
 * The device-intent exchange flow is opt-in per live-app: only active when the flag is on and the
 * given manifest id, or "*", is in the configured allowlist. The variant is what gets reported to
 * analytics and to the swap live app.
 */
export function useDeviceIntentExchangeAssignment(
  manifestId: string,
): DeviceIntentExchangeAssignment {
  const flag = useFeature("llmWalletApiDeviceIntentExchange");
  const enabledManifestIds = useMemo(
    () => new Set(flag?.params?.enabledManifestIds ?? []),
    [flag?.params?.enabledManifestIds],
  );
  const enabled = flag?.enabled ?? false;

  return {
    enabled,
    variantId: flag?.params?.variantId,
    active:
      enabled && (enabledManifestIds.has(ALL_MANIFESTS) || enabledManifestIds.has(manifestId)),
  };
}

export function useDeviceIntentExchangeEnabled(manifestId: string): boolean {
  return useDeviceIntentExchangeAssignment(manifestId).active;
}
