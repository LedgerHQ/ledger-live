import type { DeviceInfo } from "@ledgerhq/types-live";
import { getEnv } from "@ledgerhq/live-env";
import { getProviderIdUseCase } from "../device/use-cases/getProviderIdUseCase";

export { PROVIDERS } from "../device/use-cases/getProviderIdUseCase";
export function getProviderId(deviceInfo: DeviceInfo | undefined | null) {
  return getProviderIdUseCase({ deviceInfo, forceProvider: getEnv("FORCE_PROVIDER") });
}
