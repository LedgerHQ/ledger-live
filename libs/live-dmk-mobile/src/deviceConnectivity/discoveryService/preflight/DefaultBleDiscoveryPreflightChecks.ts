import { Platform } from "react-native";
import { AndroidBleDiscoveryPreflightChecks } from "./android/AndroidBleDiscoveryPreflightChecks";
import { IosBleDiscoveryPreflightChecks } from "./ios/IosBleDiscoveryPreflightChecks";
import type { DiscoveryPreflightChecks, DiscoveryPreflightResult } from "./preflightResult";

const successPreflightChecks: DiscoveryPreflightChecks = {
  getPreflight: async (): Promise<DiscoveryPreflightResult> => ({ success: true }),
};

const createPlatformPreflightChecks = (
  platformOS: typeof Platform.OS,
): DiscoveryPreflightChecks => {
  if (platformOS === "android") {
    return new AndroidBleDiscoveryPreflightChecks();
  }

  if (platformOS === "ios") {
    return new IosBleDiscoveryPreflightChecks();
  }

  return successPreflightChecks;
};

export class DefaultBleDiscoveryPreflightChecks implements DiscoveryPreflightChecks {
  private readonly preflightChecks: DiscoveryPreflightChecks;

  constructor(
    preflightChecks?: DiscoveryPreflightChecks,
    platformOS: typeof Platform.OS = Platform.OS,
  ) {
    this.preflightChecks = preflightChecks ?? createPlatformPreflightChecks(platformOS);
  }

  getPreflight(): Promise<DiscoveryPreflightResult> {
    return this.preflightChecks.getPreflight();
  }
}
