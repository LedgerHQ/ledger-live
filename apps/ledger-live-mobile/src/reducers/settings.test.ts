import { DeviceModelId } from "@ledgerhq/types-devices";
import {
  lastConnectedDeviceSelector,
  lastSeenDeviceSelector,
  resolvedThemeSelector,
  INITIAL_STATE as SETTINGS_INITIAL_STATE,
  filterValidSettings,
} from "./settings";
import { State, Theme, SettingsState } from "./types";
import { aDeviceInfoBuilder } from "@ledgerhq/live-common/mock/fixtures/aDeviceInfo";
import reducer from "./settings";
import { importSettings } from "../actions/settings";

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

describe("resolvedThemeSelector", () => {
  const createState = (theme: Theme, osTheme: string | null | undefined): State => ({
    ...({} as State),
    settings: {
      ...SETTINGS_INITIAL_STATE,
      theme,
      osTheme,
    },
  });

  describe("when theme is 'light'", () => {
    it("should return 'light' regardless of osTheme", () => {
      expect(resolvedThemeSelector(createState("light", "dark"))).toBe("light");
      expect(resolvedThemeSelector(createState("light", "light"))).toBe("light");
      expect(resolvedThemeSelector(createState("light", null))).toBe("light");
      expect(resolvedThemeSelector(createState("light", undefined))).toBe("light");
    });
  });

  describe("when theme is 'dark'", () => {
    it("should return 'dark' regardless of osTheme", () => {
      expect(resolvedThemeSelector(createState("dark", "light"))).toBe("dark");
      expect(resolvedThemeSelector(createState("dark", "dark"))).toBe("dark");
      expect(resolvedThemeSelector(createState("dark", null))).toBe("dark");
      expect(resolvedThemeSelector(createState("dark", undefined))).toBe("dark");
    });
  });

  describe("when theme is 'system'", () => {
    it("should return 'light' when osTheme is 'light'", () => {
      expect(resolvedThemeSelector(createState("system", "light"))).toBe("light");
    });

    it("should return 'dark' when osTheme is 'dark'", () => {
      expect(resolvedThemeSelector(createState("system", "dark"))).toBe("dark");
    });

    it("should return 'dark' when osTheme is null or undefined (default)", () => {
      expect(resolvedThemeSelector(createState("system", null))).toBe("dark");
      expect(resolvedThemeSelector(createState("system", undefined))).toBe("dark");
    });
  });
});

describe("filterValidSettings", () => {
  it("should keep valid settings fields", () => {
    const importedSettings: Partial<SettingsState> = {
      counterValue: "EUR",
      theme: "dark",
      language: "fr",
      locale: "fr-FR",
      hideEmptyTokenAccounts: true,
    };

    const filtered = filterValidSettings(importedSettings);

    expect(filtered).toEqual(importedSettings);
    expect(filtered.counterValue).toBe("EUR");
    expect(filtered.theme).toBe("dark");
    expect(filtered.language).toBe("fr");
    expect(filtered.locale).toBe("fr-FR");
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
      theme: "system",
      obsoleteField2: { nested: "value" },
      language: "en",
    };

    const filtered = filterValidSettings(importedSettings as Partial<SettingsState>);

    expect(filtered.counterValue).toBe("GBP");
    expect(filtered.theme).toBe("system");
    expect(filtered.language).toBe("en");
    expect("obsoleteField1" in filtered).toBe(false);
    expect("obsoleteField2" in filtered).toBe(false);
  });
});

describe("SETTINGS_IMPORT action", () => {
  it("should filter out unknown fields when importing settings", () => {
    const initialState = SETTINGS_INITIAL_STATE;
    const importedSettings = {
      counterValue: "JPY",
      theme: "dark",
      nftCollectionsStatusByNetwork: { ethereum: {} },
      deprecatedField: "should be removed",
    };

    const action = importSettings(importedSettings as Partial<SettingsState>);
    const newState = reducer(initialState, action);

    expect(newState.counterValue).toBe("JPY");
    expect(newState.theme).toBe("dark");
    expect("nftCollectionsStatusByNetwork" in newState).toBe(false);
    expect("deprecatedField" in newState).toBe(false);
  });

  it("should preserve valid settings and filter invalid ones", () => {
    const initialState = SETTINGS_INITIAL_STATE;
    const importedSettings = {
      counterValue: "CHF",
      language: "de",
      locale: "de-DE",
      oldField: "removed",
      hideEmptyTokenAccounts: false,
    };

    const action = importSettings(importedSettings as Partial<SettingsState>);
    const newState = reducer(initialState, action);

    expect(newState.counterValue).toBe("CHF");
    expect(newState.language).toBe("de");
    expect(newState.locale).toBe("de-DE");
    expect(newState.hideEmptyTokenAccounts).toBe(false);
    expect("oldField" in newState).toBe(false);
  });
});
