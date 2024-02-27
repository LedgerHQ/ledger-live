import { DeviceModelId } from "@ledgerhq/devices";
import { State } from "~/reducers/types";
import { aDeviceInfoBuilder } from "@ledgerhq/live-common/mock/fixtures/aDeviceInfo";

export function makeMockSettings({
  modelId,
  deviceName,
  version,
  hasCompletedOnboarding,
}: {
  modelId: DeviceModelId;
  deviceName?: string;
  version: string;
  hasCompletedOnboarding: boolean;
}): {
  lastConnectedDevice: State["settings"]["lastConnectedDevice"];
  lastSeenDevice: State["settings"]["lastSeenDevice"];
  hasCompletedOnboarding: boolean;
} {
  return {
    lastConnectedDevice: {
      deviceName,
      deviceId: "mockDeviceId",
      modelId,
      wired: true,
    },
    lastSeenDevice: {
      modelId,
      deviceInfo: aDeviceInfoBuilder({ version }),
      apps: [],
    },
    hasCompletedOnboarding,
  };
}
