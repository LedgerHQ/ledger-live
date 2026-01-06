import { DeviceModelId } from "@ledgerhq/types-devices";
import {
  lastConnectedDeviceSelector,
  lastSeenDeviceSelector,
  resolvedThemeSelector,
  INITIAL_STATE as SETTINGS_INITIAL_STATE,
} from "./settings";
import { State, Theme } from "./types";
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
