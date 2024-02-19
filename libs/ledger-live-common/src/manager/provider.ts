import type { DeviceInfo } from "@ledgerhq/types-live";
import { getEnv } from "@ledgerhq/live-env";
import { getProviderIdUseCase } from "@ledgerhq/live-device-core";

export function getProviderId(deviceInfo: DeviceInfo | undefined | null) {
  return getProviderIdUseCase({ deviceInfo, forceProvider: getEnv("FORCE_PROVIDER") });
}
