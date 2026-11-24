import type { Features } from "@shared/feature-flags";

type DeviceOnboardingParam = keyof NonNullable<Features["deviceOnboarding"]["params"]>;

export type DeviceOnboardingTraits = Readonly<Record<DeviceOnboardingParam, boolean>>;

export function deviceOnboardingTraits(
  flag: Features["deviceOnboarding"] | null | undefined,
): DeviceOnboardingTraits {
  const isOn = (param: DeviceOnboardingParam) => Boolean(flag?.enabled && flag.params?.[param]);
  return {
    connectSeededDevice: isOn("connectSeededDevice"),
    connectUnseededDevice: isOn("connectUnseededDevice"),
    offerLedgerSync: isOn("offerLedgerSync"),
    unifiedEntryPoints: isOn("unifiedEntryPoints"),
  };
}
