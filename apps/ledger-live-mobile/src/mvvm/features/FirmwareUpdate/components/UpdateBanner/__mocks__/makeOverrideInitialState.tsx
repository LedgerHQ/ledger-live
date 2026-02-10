import { DeviceModelId } from "@ledgerhq/devices";
import { State } from "~/reducers/types";
import { aDeviceInfoBuilder } from "@ledgerhq/live-common/mock/fixtures/aDeviceInfo";

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
  wallet40Enabled?: boolean;
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
      ...(args.wallet40Enabled !== undefined && {
        overriddenFeatureFlags: {
          ...state.settings.overriddenFeatureFlags,
          lwmWallet40: { enabled: args.wallet40Enabled },
        },
      }),
    },
    appstate: {
      ...state.appstate,
      hasConnectedDevice: args.hasConnectedDevice,
    },
  });
}
