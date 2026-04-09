import { DeviceModelId } from "@ledgerhq/types-devices";
import { CURRENT_PRIVACY_POLICY_VERSION } from "@ledgerhq/live-common/privacyConsent";
import reducer, {
  analyticsConsentInfoSelector,
  lastConnectedDeviceSelector,
  lastSeenDeviceSelector,
  resolvedThemeSelector,
  themeSelector,
  trackingEnabledSelector,
  INITIAL_STATE as SETTINGS_INITIAL_STATE,
  filterValidSettings,
} from "./settings";
import { State, Theme, SettingsState } from "./types";
import { aDeviceInfoBuilder } from "@ledgerhq/live-common/mock/fixtures/aDeviceInfo";
import { importSettings, setAnalyticsConsentInfo, setTheme } from "../actions/settings";
import { SettingsActionTypes } from "../actions/types";
const invalidDeviceModelIds = ["nanoFTS", undefined, "whatever"];
const validDeviceModelIds: DeviceModelId[] = Object.values(DeviceModelId);

const stateWithSettings = (settingsPatch: Partial<SettingsState>): State => ({
  ...({} as State),
  settings: {
    ...SETTINGS_INITIAL_STATE,
    ...settingsPatch,
    analyticsConsentInfo: {
      ...SETTINGS_INITIAL_STATE.analyticsConsentInfo,
      ...settingsPatch.analyticsConsentInfo,
    },
  },
});

/**
 * `trackingEnabledSelector` runs consent / policy / rolling-window checks only when the
 * `analyticsOptIn` feature is resolved as enabled; otherwise it only uses the toggles.
 */
const withAnalyticsOptInResolved = (base: State): State =>
  ({
    ...base,
    featureFlags: {
      resolved: {
        analyticsOptIn: { enabled: true },
      },
    },
  }) as State;

/** Matches `ONE_YEAR_MS` in `trackingEnabledSelector` (365 × 24h). */
const THREE_SIXTY_FIVE_DAYS_MS = 365 * 24 * 60 * 60 * 1000;

describe("trackingEnabledSelector", () => {
  /** Fixed clock so consent ages / one-year cutoff in `trackingEnabledSelector` do not depend on real time. */
  const FIXED_NOW = new Date("2026-03-01T12:00:00.000Z");
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns false when consentDate is null and analytics opt-in feature is on", () => {
    const state = withAnalyticsOptInResolved(
      stateWithSettings({
        analyticsConsentInfo: { consentDate: null, privacyPolicyVersion: 1 },
        analyticsEnabled: true,
      }),
    );
    expect(trackingEnabledSelector(state)).toBe(false);
  });

  it("returns true when analytics opt-in feature is off, consent is incomplete, and analytics is enabled", () => {
    const state = stateWithSettings({
      analyticsConsentInfo: { consentDate: null, privacyPolicyVersion: null },
      analyticsEnabled: true,
    });
    expect(trackingEnabledSelector(state)).toBe(true);
  });

  it("returns true when privacyPolicyVersion is null (legacy) but consent date is valid and analytics opt-in feature is on", () => {
    const state = withAnalyticsOptInResolved(
      stateWithSettings({
        analyticsConsentInfo: {
          consentDate: FIXED_NOW.toISOString(),
          privacyPolicyVersion: null,
        },
        analyticsEnabled: true,
      }),
    );
    expect(trackingEnabledSelector(state)).toBe(true);
  });

  it("returns false when consentDate parses to NaN and analytics opt-in feature is on", () => {
    const state = withAnalyticsOptInResolved(
      stateWithSettings({
        analyticsConsentInfo: {
          consentDate: "not-a-valid-date",
          privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
        },
        analyticsEnabled: true,
      }),
    );
    expect(trackingEnabledSelector(state)).toBe(false);
  });

  it("returns true when privacy policy version is below current but consent is within one year and analytics opt-in feature is on", () => {
    const state = withAnalyticsOptInResolved(
      stateWithSettings({
        analyticsConsentInfo: {
          consentDate: "2025-06-01T00:00:00.000Z",
          privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION - 1,
        },
        analyticsEnabled: true,
        personalizedRecommendationsEnabled: true,
      }),
    );
    expect(trackingEnabledSelector(state)).toBe(true);
  });

  it("returns false when consent is older than a 365-day rolling window and analytics opt-in feature is on", () => {
    const expiredConsent = new Date(
      FIXED_NOW.getTime() - THREE_SIXTY_FIVE_DAYS_MS - 24 * 60 * 60 * 1000,
    ).toISOString();

    const state = withAnalyticsOptInResolved(
      stateWithSettings({
        analyticsConsentInfo: {
          consentDate: expiredConsent,
          privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
        },
        analyticsEnabled: true,
      }),
    );
    expect(trackingEnabledSelector(state)).toBe(false);
  });

  it("returns true when consent is exactly on the 365-day cutoff and analytics opt-in feature is on", () => {
    const now = new Date("2026-01-10T00:00:00.000Z").getTime();
    jest.setSystemTime(now);

    const consentOnCutoff = new Date(now - THREE_SIXTY_FIVE_DAYS_MS).toISOString();

    const state = withAnalyticsOptInResolved(
      stateWithSettings({
        analyticsConsentInfo: {
          consentDate: consentOnCutoff,
          privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
        },
        analyticsEnabled: true,
        personalizedRecommendationsEnabled: false,
      }),
    );
    expect(trackingEnabledSelector(state)).toBe(true);
  });

  it("returns false when consent is valid but analytics and personalized recommendations are off and analytics opt-in feature is on", () => {
    const state = withAnalyticsOptInResolved(
      stateWithSettings({
        analyticsConsentInfo: {
          consentDate: "2026-02-01T00:00:00.000Z",
          privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
        },
        analyticsEnabled: false,
        personalizedRecommendationsEnabled: false,
      }),
    );
    expect(trackingEnabledSelector(state)).toBe(false);
  });

  it("returns false when analytics opt-in feature is off and both toggles are off despite valid consent", () => {
    const state = stateWithSettings({
      analyticsConsentInfo: {
        consentDate: "2026-02-01T00:00:00.000Z",
        privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
      },
      analyticsEnabled: false,
      personalizedRecommendationsEnabled: false,
    });
    expect(trackingEnabledSelector(state)).toBe(false);
  });

  it("returns true when consent is valid, analytics opt-in feature is on, and analytics is enabled", () => {
    const state = withAnalyticsOptInResolved(
      stateWithSettings({
        analyticsConsentInfo: {
          consentDate: "2026-02-01T00:00:00.000Z",
          privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
        },
        analyticsEnabled: true,
        personalizedRecommendationsEnabled: false,
      }),
    );
    expect(trackingEnabledSelector(state)).toBe(true);
  });

  it("returns true when consent is valid, analytics opt-in feature is on, and personalized recommendations are enabled", () => {
    const state = withAnalyticsOptInResolved(
      stateWithSettings({
        analyticsConsentInfo: {
          consentDate: "2026-02-01T00:00:00.000Z",
          privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
        },
        analyticsEnabled: false,
        personalizedRecommendationsEnabled: true,
      }),
    );
    expect(trackingEnabledSelector(state)).toBe(true);
  });

  it("returns true when analytics opt-in feature is off and only personalized recommendations are enabled", () => {
    const state = stateWithSettings({
      analyticsConsentInfo: { consentDate: null, privacyPolicyVersion: null },
      analyticsEnabled: false,
      personalizedRecommendationsEnabled: true,
    });
    expect(trackingEnabledSelector(state)).toBe(true);
  });
});

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

describe("default theme", () => {
  it("should have theme set to 'dark' in initial state", () => {
    expect(SETTINGS_INITIAL_STATE.theme).toBe("dark");
  });
});

describe("SETTINGS_SET_THEME", () => {
  it("should update theme when setTheme action is dispatched", () => {
    const stateAfterLight = reducer(SETTINGS_INITIAL_STATE, setTheme("light"));
    expect(stateAfterLight.theme).toBe("light");

    const stateAfterDark = reducer(stateAfterLight, setTheme("dark"));
    expect(stateAfterDark.theme).toBe("dark");

    const stateAfterSystem = reducer(stateAfterDark, setTheme("system"));
    expect(stateAfterSystem.theme).toBe("system");
  });

  it("should reflect theme change in resolvedThemeSelector", () => {
    const stateWithLight: State = {
      ...({} as State),
      settings: reducer(SETTINGS_INITIAL_STATE, setTheme("light")),
    };
    expect(themeSelector(stateWithLight)).toBe("light");
    expect(resolvedThemeSelector(stateWithLight)).toBe("light");

    const stateWithDark: State = {
      ...({} as State),
      settings: reducer(SETTINGS_INITIAL_STATE, setTheme("dark")),
    };
    expect(themeSelector(stateWithDark)).toBe("dark");
    expect(resolvedThemeSelector(stateWithDark)).toBe("dark");
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

describe("analyticsConsentInfo initial state", () => {
  it("should default consentDate and privacyPolicyVersion to null", () => {
    expect(SETTINGS_INITIAL_STATE.analyticsConsentInfo).toEqual({
      consentDate: null,
      privacyPolicyVersion: null,
    });
  });

  it("should set analyticsConsentInfo from action payload", () => {
    const payload = {
      consentDate: "2025-03-26T12:00:00.000Z",
      privacyPolicyVersion: 1,
    };
    const action = setAnalyticsConsentInfo(payload);

    expect(action.type).toBe(SettingsActionTypes.SET_ANALYTICS_CONSENT_INFO);
    expect(action.payload).toEqual(payload);

    const newState = reducer(SETTINGS_INITIAL_STATE, action);
    expect(newState.analyticsConsentInfo).toEqual(payload);
  });

  it("should replace analyticsConsentInfo when dispatched again", () => {
    const first = {
      consentDate: "2025-01-01T00:00:00.000Z",
      privacyPolicyVersion: 1,
    };
    const second = {
      consentDate: "2025-06-01T00:00:00.000Z",
      privacyPolicyVersion: 2,
    };

    const afterFirst = reducer(SETTINGS_INITIAL_STATE, setAnalyticsConsentInfo(first));
    const afterSecond = reducer(afterFirst, setAnalyticsConsentInfo(second));

    expect(afterSecond.analyticsConsentInfo).toEqual(second);
  });

  it("should expose stored value via analyticsConsentInfoSelector", () => {
    const payload = {
      consentDate: "2025-03-26T12:00:00.000Z",
      privacyPolicyVersion: 3,
    };
    const settings = reducer(SETTINGS_INITIAL_STATE, setAnalyticsConsentInfo(payload));
    const state = { ...({} as State), settings };

    expect(analyticsConsentInfoSelector(state)).toEqual(payload);
  });
});

describe("filterValidSettings for analyticsConsentInfo", () => {
  it("should keep analyticsConsentInfo when importing partial settings", () => {
    const importedSettings: Partial<SettingsState> = {
      analyticsConsentInfo: {
        consentDate: "2025-02-01T10:00:00.000Z",
        privacyPolicyVersion: 2,
      },
    };

    expect(filterValidSettings(importedSettings)).toEqual(importedSettings);
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
