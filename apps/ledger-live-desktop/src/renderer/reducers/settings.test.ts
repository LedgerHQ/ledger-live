/**
 * @jest-environment jsdom
 */

import { getBrazeCampaignCutoff } from "@ledgerhq/live-common/braze/anonymousUsers";
import { aDeviceInfoBuilder } from "@ledgerhq/live-common/mock/fixtures/aDeviceInfo";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { State } from ".";
import { purgeExpiredAnonymousUserNotifications } from "../actions/settings";
import reducer, {
  lastSeenDeviceSelector,
  localeSelector,
  INITIAL_STATE as SETTINGS_INITIAL_STATE,
  SettingsState,
} from "./settings";

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
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
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
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        modelId: deviceModelId as DeviceModelId, // We might have invalid values in the store
        deviceInfo: aDeviceInfoBuilder(),
        apps: [],
      };
      const state = {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
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
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      ...({} as State),
      settings: {
        ...SETTINGS_INITIAL_STATE,
      },
    };
    expect(localeSelector(state)).toEqual("en-US");
  });

  it("should return fr-FR when the locale is set", () => {
    const state = {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
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
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      ...({} as State),
      settings: {
        ...SETTINGS_INITIAL_STATE,
        locale: "fa-AF",
      },
    };
    expect(localeSelector(state)).toEqual("en-US");
  });
});

describe("action: purgeAnonymousUserNotifications", () => {
  it("should remove notifications older than cutoff but keep newer ones", () => {
    const now = new Date();
    const cutoff = getBrazeCampaignCutoff(now);

    const oldTimestamp = cutoff - 1;
    const newTimestamp = cutoff + 1;

    const state: SettingsState = {
      ...SETTINGS_INITIAL_STATE,
      anonymousUserNotifications: {
        a: oldTimestamp,
        b: newTimestamp,
        LNSUpsell: oldTimestamp,
      },
    };

    const newState = reducer(state, purgeExpiredAnonymousUserNotifications({ now }));

    expect(newState.anonymousUserNotifications).toEqual({
      b: newTimestamp,
      LNSUpsell: oldTimestamp,
    });
  });

  it("should keep all notifications if none are expired", () => {
    const now = new Date();
    const ts = now.getTime() - 1000;

    const state: SettingsState = {
      ...SETTINGS_INITIAL_STATE,
      anonymousUserNotifications: {
        a: ts,
        b: ts,
        LNSUpsell: ts,
      },
    };

    const newState = reducer(state, purgeExpiredAnonymousUserNotifications({ now }));

    expect(newState).toBe(state);
  });

  it("should keep LNSUpsell even if expired", () => {
    const now = new Date();
    const cutoff = getBrazeCampaignCutoff(now);
    const expired = cutoff - 1;

    const state: SettingsState = {
      ...SETTINGS_INITIAL_STATE,
      anonymousUserNotifications: {
        x: expired,
        LNSUpsell: expired,
      },
    };

    const newState = reducer(state, purgeExpiredAnonymousUserNotifications({ now }));

    expect(newState.anonymousUserNotifications).toEqual({
      LNSUpsell: expired,
    });
  });

  it("should return original state if anonymousUserNotifications is empty", () => {
    const now = new Date();
    const state: SettingsState = {
      ...SETTINGS_INITIAL_STATE,
      anonymousUserNotifications: {},
    };

    const newState = reducer(state, purgeExpiredAnonymousUserNotifications({ now }));

    expect(newState).toBe(state);
  });
});
