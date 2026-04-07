import { DeviceModelId } from "@ledgerhq/devices";
import { State } from "~/reducers/types";
import { aDeviceInfoBuilder } from "@ledgerhq/live-common/mock/fixtures/aDeviceInfo";
import { withFlagOverrides } from "@tests/test-renderer";

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
  lwmWallet40?: Parameters<typeof withFlagOverrides>[0]["lwmWallet40"];
}) {
  return (state: State): State => {
    let result: State = {
      ...state,
      settings: {
        ...state.settings,
        ...makeMockSettings({
          modelId: args.deviceModelId,
          version: args.version,
          hasCompletedOnboarding: args.hasCompletedOnboarding,
          wired: args.wired,
        }),
      },
      appstate: {
        ...state.appstate,
        hasConnectedDevice: args.hasConnectedDevice,
      },
    };
    if (args.lwmWallet40 !== undefined) {
      result = withFlagOverrides({ lwmWallet40: args.lwmWallet40 })(result);
    }
    return result;
  };
}
