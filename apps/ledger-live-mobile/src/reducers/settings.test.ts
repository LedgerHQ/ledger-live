import { DeviceModelId } from "@ledgerhq/types-devices";
import {
  lastConnectedDeviceSelector,
  lastSeenDeviceSelector,
  INITIAL_STATE as SETTINGS_INITIAL_STATE,
} from "./settings";
import { State } from "./types";
import { aDeviceInfoBuilder } from "@ledgerhq/live-common/mock/fixtures/aDeviceInfo";

const invalidDeviceModelIds = ["nanoFTS", undefined, "whatever"];
const validDeviceModelIds: DeviceModelId[] = Object.values(DeviceModelId);

describe("lastConnectedDeviceSelector", () => {
  it("should return the last connected device if the deviceModelId is valid", () => {
    validDeviceModelIds.forEach(deviceModelId => {
      const lastConnectedDevice: State["settings"]["lastConnectedDevice"] = {
        deviceId: "whatever",
        modelId: deviceModelId,
        wired: true,
      };
      const state = {
        ...({} as State),
        settings: {
          ...SETTINGS_INITIAL_STATE,
          lastConnectedDevice,
        },
      };

      expect(lastConnectedDeviceSelector(state)).toEqual(lastConnectedDevice);
    });
  });

  it("should return null if the deviceModelId is invalid", () => {
    invalidDeviceModelIds.forEach(deviceModelId => {
      const lastConnectedDevice: State["settings"]["lastConnectedDevice"] = {
        deviceId: "whatever",
        modelId: deviceModelId as DeviceModelId, // We might have invalid values in the store
        wired: true,
      };
      const state = {
        ...({} as State),
        settings: {
          ...SETTINGS_INITIAL_STATE,
          lastConnectedDevice,
        },
      };

      expect(lastConnectedDeviceSelector(state)).toBeNull();
    });
  });
});

describe("lastSeenDeviceSelector", () => {
  it("should return the last seen device if the deviceModelId is valid", () => {
    validDeviceModelIds.forEach(deviceModelId => {
      const lastSeenDevice: State["settings"]["seenDevices"][0] = {
        modelId: deviceModelId,
        deviceInfo: aDeviceInfoBuilder(),
        apps: [],
      };
      const state = {
        ...({} as State),
        settings: {
          ...SETTINGS_INITIAL_STATE,
          seenDevices: [lastSeenDevice],
        },
      };
      expect(lastSeenDeviceSelector(state)).toEqual(lastSeenDevice);
    });
  });

  it("should return null if the deviceModelId is invalid", () => {
    invalidDeviceModelIds.forEach(deviceModelId => {
      const lastSeenDevice: State["settings"]["seenDevices"][0] = {
        modelId: deviceModelId as DeviceModelId, // We might have invalid values in the store
        deviceInfo: aDeviceInfoBuilder(),
        apps: [],
      };
      const state = {
        ...({} as State),
        settings: {
          ...SETTINGS_INITIAL_STATE,
          seenDevices: [lastSeenDevice],
        },
      };

      expect(lastSeenDeviceSelector(state)).toBeNull();
    });
  });
});
