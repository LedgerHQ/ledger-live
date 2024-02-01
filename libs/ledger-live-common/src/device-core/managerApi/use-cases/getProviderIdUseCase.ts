import { DeviceInfoEntity } from "../entities/DeviceInfoEntity";

export const PROVIDERS: Record<string, number> = {
  das: 2,
  club: 3,
  shitcoins: 4,
  ee: 5,
};

export function getProviderIdUseCase({
  deviceInfo,
  forceProvider,
}: {
  deviceInfo: DeviceInfoEntity | undefined | null;
  forceProvider?: number;
}): number {
  if (forceProvider && forceProvider !== 1) return forceProvider;
  if (!deviceInfo) return 1;
  const { providerName } = deviceInfo;
  const maybeProvider = providerName && PROVIDERS[providerName];
  if (maybeProvider) return maybeProvider;
  return 1;
}
