import type { DeviceInfo } from "@ledgerhq/types-live";
import { getEnv } from "@ledgerhq/live-env";
export const PROVIDERS: Record<string, number> = {
  das: 2,
  club: 3,
  shitcoins: 4,
  ee: 5,
};
export function getProviderId(deviceInfo: DeviceInfo | undefined | null): number {
  const forceProvider = getEnv("FORCE_PROVIDER");
  if (forceProvider && forceProvider !== 1) return forceProvider;
  if (!deviceInfo) return 1;
  const { providerName } = deviceInfo;
  const maybeProvider = providerName && PROVIDERS[providerName];
  if (maybeProvider) return maybeProvider;
  return 1;
}
