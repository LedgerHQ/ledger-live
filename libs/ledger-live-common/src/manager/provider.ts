import type { DeviceInfo } from "@ledgerhq/types-live";
import { getEnv } from "@ledgerhq/live-env";
export const PROVIDERS: Record<string, number> = {
  das: 2,
  club: 3,
  shitcoins: 4,
  ee: 5,
};

export function getProviderIdPure({
  deviceInfo,
  forceProvider,
}: {
  deviceInfo: DeviceInfo | undefined | null;
  forceProvider?: number;
}): number {
  if (forceProvider && forceProvider !== 1) return forceProvider;
  if (!deviceInfo) return 1;
  const { providerName } = deviceInfo;
  const maybeProvider = providerName && PROVIDERS[providerName];
  if (maybeProvider) return maybeProvider;
  return 1;
}

export function getProviderId(deviceInfo: DeviceInfo | undefined | null) {
  return getProviderIdPure({ deviceInfo, forceProvider: getEnv("FORCE_PROVIDER") });
}
