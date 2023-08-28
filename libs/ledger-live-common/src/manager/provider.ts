import type { DeviceInfo } from "@ledgerhq/types-live";
import { getEnv } from "@ledgerhq/live-env";
export const PROVIDERS: Record<string, number> = {
  das: 2,
  club: 3,
  shitcoins: 4,
  ee: 5,
};
export function getProviderId({ providerName }: DeviceInfo): number {
  const forceProvider = getEnv("FORCE_PROVIDER");
  if (forceProvider && forceProvider !== 1) return forceProvider;
  const maybeProvider = providerName && PROVIDERS[providerName];
  if (maybeProvider) return maybeProvider;
  return 1;
}
