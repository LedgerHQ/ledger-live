import { DeviceModelId } from "@ledgerhq/devices";
import { State } from "~/reducers/types";
import { aDeviceInfoBuilder } from "@ledgerhq/live-common/mock/fixtures/aDeviceInfo";
import { Feature_LwmWallet40 } from "@ledgerhq/types-live";

function makeMockSettings({
  modelId,
  deviceName,
  version,
  hasCompletedOnboarding,
  wired,
}: {
  modelId: DeviceModelId;
  deviceName?: string;
  version: string;
  hasCompletedOnboarding: boolean;
  wired: boolean;
}): {
  lastConnectedDevice: State["settings"]["lastConnectedDevice"];
  seenDevices: State["settings"]["seenDevices"];
  hasCompletedOnboarding: boolean;
} {
  return {
    lastConnectedDevice: {
      deviceName,
      deviceId: "mockDeviceId",
      modelId,
      wired,
    },
    seenDevices: [
      {
        modelId,
        deviceInfo: aDeviceInfoBuilder({ version }),
        apps: [],
      },
    ],
    hasCompletedOnboarding,
  };
}

export function makeOverrideInitialState(args: {
  deviceModelId: DeviceModelId;
  version: string;
  hasCompletedOnboarding: boolean;
  wired: boolean;
  hasConnectedDevice: boolean;
  lwmWallet40?: { enabled: boolean; params: Partial<Feature_LwmWallet40["params"]> };
}) {
  return (state: State): State => ({
    ...state,
    settings: {
      ...state.settings,
      ...makeMockSettings({
        modelId: args.deviceModelId,
        version: args.version,
        hasCompletedOnboarding: args.hasCompletedOnboarding,
        wired: args.wired,
      }),
      ...(args.lwmWallet40 !== undefined && {
        overriddenFeatureFlags: {
          ...state.settings.overriddenFeatureFlags,
          lwmWallet40: { enabled: args.lwmWallet40.enabled, params: args.lwmWallet40.params },
        },
      }),
    },
    appstate: {
      ...state.appstate,
      hasConnectedDevice: args.hasConnectedDevice,
    },
  });
}
