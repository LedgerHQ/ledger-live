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
  filterValidSettings,
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

describe("filterValidSettings", () => {
  it("should keep valid settings fields", () => {
    const importedSettings: Partial<SettingsState> = {
      counterValue: "EUR",
      theme: "dark",
      language: "en",
      locale: "en-US",
      hideEmptyTokenAccounts: true,
    };

    const filtered = filterValidSettings(importedSettings);

    expect(filtered).toEqual(importedSettings);
    expect(filtered.counterValue).toBe("EUR");
    expect(filtered.theme).toBe("dark");
    expect(filtered.language).toBe("en");
    expect(filtered.locale).toBe("en-US");
    expect(filtered.hideEmptyTokenAccounts).toBe(true);
  });

  it("should filter out unknown/obsolete fields like nftCollectionsStatusByNetwork", () => {
    const importedSettings = {
      counterValue: "USD",
      theme: "light",
      nftCollectionsStatusByNetwork: { ethereum: { someCollection: true } },
      someOtherUnknownField: "should be filtered",
    };

    const filtered = filterValidSettings(importedSettings as Partial<SettingsState>);

    expect(filtered.counterValue).toBe("USD");
    expect(filtered.theme).toBe("light");
    expect("nftCollectionsStatusByNetwork" in filtered).toBe(false);
    expect("someOtherUnknownField" in filtered).toBe(false);
  });

  it("should handle empty object", () => {
    const filtered = filterValidSettings({});

    expect(filtered).toEqual({});
  });

  it("should handle mixed valid and invalid fields", () => {
    const importedSettings = {
      counterValue: "GBP",
      obsoleteField1: "value1",
      theme: "dark",
      obsoleteField2: { nested: "value" },
      language: "en",
    };

    const filtered = filterValidSettings(importedSettings as Partial<SettingsState>);

    expect(filtered.counterValue).toBe("GBP");
    expect(filtered.theme).toBe("dark");
    expect(filtered.language).toBe("en");
    expect("obsoleteField1" in filtered).toBe(false);
    expect("obsoleteField2" in filtered).toBe(false);
  });
});

describe("FETCH_SETTINGS action", () => {
  it("should filter out unknown fields when fetching settings", () => {
    const initialState = SETTINGS_INITIAL_STATE;
    const importedSettings = {
      ...SETTINGS_INITIAL_STATE,
      counterValue: "JPY",
      theme: "dark",
      nftCollectionsStatusByNetwork: { ethereum: {} },
      deprecatedField: "should be removed",
    };

    const action = {
      type: "FETCH_SETTINGS" as const,
      payload: importedSettings as Partial<SettingsState>,
    };
    const newState = reducer(initialState, action);

    expect(newState.counterValue).toBe("JPY");
    expect(newState.theme).toBe("dark");
    expect(newState.loaded).toBe(true);
    expect("nftCollectionsStatusByNetwork" in newState).toBe(false);
    expect("deprecatedField" in newState).toBe(false);
  });

  it("should preserve valid settings and filter invalid ones", () => {
    const initialState = SETTINGS_INITIAL_STATE;
    const importedSettings = {
      ...SETTINGS_INITIAL_STATE,
      counterValue: "CHF",
      language: "en",
      locale: "en-GB",
      oldField: "removed",
      hideEmptyTokenAccounts: false,
    };

    const action = {
      type: "FETCH_SETTINGS" as const,
      payload: importedSettings as Partial<SettingsState>,
    };
    const newState = reducer(initialState, action);

    expect(newState.counterValue).toBe("CHF");
    expect(newState.language).toBe("en");
    expect(newState.locale).toBe("en-GB");
    expect(newState.hideEmptyTokenAccounts).toBe(false);
    expect(newState.loaded).toBe(true);
    expect("oldField" in newState).toBe(false);
  });
});

describe("SAVE_SETTINGS action", () => {
  it("should filter out unknown fields when saving settings", () => {
    const initialState = SETTINGS_INITIAL_STATE;
    const settingsToSave = {
      counterValue: "AUD",
      nftCollectionsStatusByNetwork: { polygon: {} },
      theme: "light",
    };

    const action = {
      type: "SAVE_SETTINGS" as const,
      payload: settingsToSave as Partial<SettingsState>,
    };
    const newState = reducer(initialState, action);

    expect(newState.counterValue).toBe("AUD");
    expect(newState.theme).toBe("light");
    expect("nftCollectionsStatusByNetwork" in newState).toBe(false);
  });
});
