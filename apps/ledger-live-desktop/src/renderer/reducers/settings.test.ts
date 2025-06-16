/**
 * @jest-environment jsdom
 */

import { DeviceModelId } from "@ledgerhq/types-devices";
import {
  lastSeenDeviceSelector,
  INITIAL_STATE as SETTINGS_INITIAL_STATE,
  localeSelector,
} from "./settings";
import { State } from ".";
import { aDeviceInfoBuilder } from "@ledgerhq/live-common/mock/fixtures/aDeviceInfo";

const invalidDeviceModelIds = ["nanoFTS", undefined, "whatever"];
const validDeviceModelIds: DeviceModelId[] = Object.values(DeviceModelId);

describe("lastSeenDeviceSelector", () => {
  it("should return the last seen device if the deviceModelId is valid", () => {
    validDeviceModelIds.forEach(deviceModelId => {
      const lastSeenDevice: State["settings"]["lastSeenDevice"] = {
        modelId: deviceModelId,
        deviceInfo: aDeviceInfoBuilder(),
        apps: [],
      };
      const state = {
        ...({} as State),
        settings: {
          ...SETTINGS_INITIAL_STATE,
          lastSeenDevice,
        },
      };
      expect(lastSeenDeviceSelector(state)).toEqual(lastSeenDevice);
    });
  });

  it("should return null if the deviceModelId is invalid", () => {
    invalidDeviceModelIds.forEach(deviceModelId => {
      const lastSeenDevice: State["settings"]["lastSeenDevice"] = {
        modelId: deviceModelId as DeviceModelId, // We might have invalid values in the store
        deviceInfo: aDeviceInfoBuilder(),
        apps: [],
      };
      const state = {
        ...({} as State),
        settings: {
          ...SETTINGS_INITIAL_STATE,
          lastSeenDevice,
        },
      };

      expect(lastSeenDeviceSelector(state)).toBeNull();
    });
  });

  it("should return en-US when the locale is not set", () => {
    const state = {
      ...({} as State),
      settings: {
        ...SETTINGS_INITIAL_STATE,
      },
    };
    expect(localeSelector(state)).toEqual("en-US");
  });

  it("should return fr-FR when the locale is set", () => {
    const state = {
      ...({} as State),
      settings: {
        ...SETTINGS_INITIAL_STATE,
        locale: "fr-FR",
      },
    };
    expect(localeSelector(state)).toEqual("fr-FR");
  });

  it("should return en-US when the locale is set to OFAC locale", () => {
    const state = {
      ...({} as State),
      settings: {
        ...SETTINGS_INITIAL_STATE,
        locale: "fa-AF",
      },
    };
    expect(localeSelector(state)).toEqual("en-US");
  });
});
