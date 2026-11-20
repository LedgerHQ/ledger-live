import type { Features } from "@shared/feature-flags";

export function deviceOnboardingTraits(flag: Features["deviceOnboarding"] | null | undefined) {
  const enabled = Boolean(flag?.enabled);
  const params = enabled ? flag?.params : undefined;
  return {
    deviceOnboarding: enabled,
    connectSeededDevice: Boolean(params?.connectSeededDevice),
    connectUnseededDevice: Boolean(params?.connectUnseededDevice),
    offerLedgerSync: Boolean(params?.offerLedgerSync),
    unifiedEntryPoints: Boolean(params?.unifiedEntryPoints),
  };
}
