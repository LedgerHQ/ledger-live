/**
 * @jest-environment jsdom
 */

import { getBrazeCampaignCutoff } from "@ledgerhq/live-common/braze/anonymousUsers";
import { aDeviceInfoBuilder } from "@ledgerhq/live-common/mock/fixtures/aDeviceInfo";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { FEATURE_FLAGS_INITIAL_STATE, type Features } from "@shared/feature-flags";
import { State } from ".";
import { purgeExpiredAnonymousUserNotifications } from "../actions/settings";
import reducer, {
  lastSeenDeviceSelector,
  languageSelector,
  localeSelector,
  INITIAL_STATE as SETTINGS_INITIAL_STATE,
  SettingsState,
  filterValidSettings,
  trackingEnabledSelector,
} from "./settings";
const invalidDeviceModelIds = ["nanoFTS", undefined, "whatever"];
const validDeviceModelIds: DeviceModelId[] = Object.values(DeviceModelId);

const mockStateWithSettings = (
  settings: Partial<SettingsState>,
  analyticsOptInPatch: Partial<Features["analyticsOptIn"]> = {},
): State => ({
  ...({} as State),
  featureFlags: {
    ...FEATURE_FLAGS_INITIAL_STATE,
    resolved: {
      ...FEATURE_FLAGS_INITIAL_STATE.resolved,
      analyticsOptIn: {
        ...FEATURE_FLAGS_INITIAL_STATE.resolved.analyticsOptIn,
        enabled: true,
        ...analyticsOptInPatch,
      },
    },
  },
  settings: {
    ...SETTINGS_INITIAL_STATE,
    ...settings,
  },
});

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

  it("should fall back to the language when the locale is unknown to regions.json", () => {
    const state = {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      ...({} as State),
      settings: {
        ...SETTINGS_INITIAL_STATE,
        language: "en" as const,
        locale: "xx-YY",
      },
    };
    expect(localeSelector(state)).toEqual("en");
  });
});

describe("languageSelector", () => {
  const buildState = (settings: Partial<SettingsState>): State => ({
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    ...({} as State),
    settings: {
      ...SETTINGS_INITIAL_STATE,
      ...settings,
    },
  });

  it.each([
    { case: "supported language", language: "fr", expected: "fr" },
    {
      case: "unsupported language",
      language: "xx",
      expected: SETTINGS_INITIAL_STATE.language,
    },
    {
      case: "missing language",
      language: undefined,
      expected: SETTINGS_INITIAL_STATE.language,
    },
  ])("should resolve to $expected for $case", ({ language, expected }) => {
    expect(
      languageSelector(
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        buildState({ language: language as SettingsState["language"] }),
      ),
    ).toBe(expected);
  });

  it("should return a stable primitive across calls (no new reference allocated)", () => {
    const state = buildState({ language: "fr" });
    expect(languageSelector(state)).toBe(languageSelector(state));
  });
});

describe("INITIAL_STATE defaults", () => {
  it("should default theme to dark", () => {
    expect(SETTINGS_INITIAL_STATE.theme).toBe("dark");
  });

  it("should default analytics consent flags to false", () => {
    expect(SETTINGS_INITIAL_STATE.shareAnalytics).toBe(false);
    expect(SETTINGS_INITIAL_STATE.sharePersonalizedRecommandations).toBe(false);
  });
});

describe("FETCH_SETTINGS preserves persisted analytics consent", () => {
  it("should keep persisted shareAnalytics=true (returning opted-in users not regressed)", () => {
    const initialState = SETTINGS_INITIAL_STATE;
    const action = {
      type: "FETCH_SETTINGS" as const,
      payload: {
        shareAnalytics: true,
        sharePersonalizedRecommandations: true,
      } as Partial<SettingsState>,
    };
    const newState = reducer(initialState, action);

    expect(newState.shareAnalytics).toBe(true);
    expect(newState.sharePersonalizedRecommandations).toBe(true);
    expect(newState.loaded).toBe(true);
  });

  it("should keep persisted shareAnalytics=false for returning opted-out users", () => {
    const initialState = SETTINGS_INITIAL_STATE;
    const action = {
      type: "FETCH_SETTINGS" as const,
      payload: {
        shareAnalytics: false,
        sharePersonalizedRecommandations: false,
      } as Partial<SettingsState>,
    };
    const newState = reducer(initialState, action);

    expect(newState.shareAnalytics).toBe(false);
    expect(newState.sharePersonalizedRecommandations).toBe(false);
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

describe("SAVE_SETTINGS and analytics consent", () => {
  it("should not apply analyticsConsentInfo via SAVE_SETTINGS (use SAVE_ANALYTICS_CONSENT_INFO)", () => {
    const initialState = SETTINGS_INITIAL_STATE;
    const action = {
      type: "SAVE_SETTINGS" as const,
      payload: {
        analyticsConsentInfo: {
          consentDate: "2099-01-01T00:00:00.000Z",
          privacyPolicyVersion: 99,
        },
      },
    };
    const newState = reducer(initialState, action);

    expect(newState).toBe(initialState);
  });
});

describe("SAVE_ANALYTICS_CONSENT_INFO action", () => {
  it("should merge into analyticsConsentInfo and sync legacy consent fields", () => {
    const initialState = SETTINGS_INITIAL_STATE;
    const action = {
      type: "SAVE_ANALYTICS_CONSENT_INFO" as const,
      payload: { privacyPolicyVersion: 2 },
    };
    const newState = reducer(initialState, action);

    expect(newState.analyticsConsentInfo.privacyPolicyVersion).toBe(2);
    expect(newState.analyticsConsentInfo.consentDate).toBe(
      initialState.analyticsConsentInfo.consentDate,
    );
    expect(newState.privacyPolicyVersion).toBe(2);
    expect(newState.lastAnalyticsConsentDate).toBe(initialState.analyticsConsentInfo.consentDate);
  });

  it("should be a no-op when merged values are unchanged", () => {
    const initialState = SETTINGS_INITIAL_STATE;
    const action = {
      type: "SAVE_ANALYTICS_CONSENT_INFO" as const,
      payload: {},
    };
    expect(reducer(initialState, action)).toBe(initialState);
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

describe("trackingEnabledSelector", () => {
  /** Frozen clock; consent age uses the same `needsConsentRenewal` + `consentValidityDays` path as production. */
  const FIXED_NOW = new Date("2024-06-15T12:00:00.000Z");

  const addDaysUtc = (date: Date, days: number): Date => {
    const d = new Date(date.getTime());
    d.setUTCDate(d.getUTCDate() + days);
    return d;
  };

  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.setSystemTime(FIXED_NOW);
  });

  it("should not track if lastAnalyticsConsentDate is not set", () => {
    expect(
      trackingEnabledSelector(
        mockStateWithSettings({
          lastAnalyticsConsentDate: null,
        }),
      ),
    ).toBe(false);
  });

  it("should track when privacyPolicyVersion is null if consent date is valid and share toggles are on", () => {
    expect(
      trackingEnabledSelector(
        mockStateWithSettings({
          lastAnalyticsConsentDate: FIXED_NOW.toISOString(),
          privacyPolicyVersion: null,
          shareAnalytics: true,
          sharePersonalizedRecommandations: true,
        }),
      ),
    ).toBe(true);
  });

  describe("opt-in analytics", () => {
    it("should track if lastAnalyticsConsentDate is set and share toggles are on", () => {
      expect(
        trackingEnabledSelector(
          mockStateWithSettings({
            lastAnalyticsConsentDate: FIXED_NOW.toISOString(),
            privacyPolicyVersion: 1,
            shareAnalytics: true,
            sharePersonalizedRecommandations: true,
          }),
        ),
      ).toBe(true);
    });

    it("should not track if lastAnalyticsConsentDate is outside the configured validity window", () => {
      const lastAnalyticsConsentDate = addDaysUtc(FIXED_NOW, -400).toISOString();
      expect(
        trackingEnabledSelector(
          mockStateWithSettings({
            shareAnalytics: true,
            sharePersonalizedRecommandations: true,
            lastAnalyticsConsentDate,
            privacyPolicyVersion: 1,
          }),
        ),
      ).toBe(false);
    });

    it("should track if lastAnalyticsConsentDate is exactly on the rolling window boundary", () => {
      const lastAnalyticsConsentDate = addDaysUtc(FIXED_NOW, -365).toISOString();
      expect(
        trackingEnabledSelector(
          mockStateWithSettings({
            shareAnalytics: true,
            sharePersonalizedRecommandations: true,
            lastAnalyticsConsentDate,
            privacyPolicyVersion: 1,
          }),
        ),
      ).toBe(true);
    });

    it("should track if lastAnalyticsConsentDate is within the window", () => {
      const lastAnalyticsConsentDate = addDaysUtc(FIXED_NOW, -300).toISOString();
      expect(
        trackingEnabledSelector(
          mockStateWithSettings({
            shareAnalytics: true,
            sharePersonalizedRecommandations: true,
            lastAnalyticsConsentDate,
            privacyPolicyVersion: 1,
          }),
        ),
      ).toBe(true);
    });

    it("should track if lastAnalyticsConsentDate is within the window even when privacyPolicyVersion is older than the flag", () => {
      const lastAnalyticsConsentDate = addDaysUtc(FIXED_NOW, -300).toISOString();
      expect(
        trackingEnabledSelector(
          mockStateWithSettings(
            {
              shareAnalytics: true,
              sharePersonalizedRecommandations: true,
              lastAnalyticsConsentDate,
              privacyPolicyVersion: 0,
            },
            { params: { policyVersion: 1, consentValidityDays: 365 } },
          ),
        ),
      ).toBe(true);
    });

    it("should respect consentValidityDays from resolved flag params", () => {
      const lastAnalyticsConsentDate = addDaysUtc(FIXED_NOW, -40).toISOString();
      expect(
        trackingEnabledSelector(
          mockStateWithSettings(
            {
              shareAnalytics: true,
              sharePersonalizedRecommandations: true,
              lastAnalyticsConsentDate,
              privacyPolicyVersion: 1,
            },
            { params: { policyVersion: 1, consentValidityDays: 30 } },
          ),
        ),
      ).toBe(false);
    });
  });

  describe("opt-out analytics", () => {
    it("should not track even if lastAnalyticsConsentDate is set and consent metadata is complete", () => {
      expect(
        trackingEnabledSelector(
          mockStateWithSettings({
            lastAnalyticsConsentDate: FIXED_NOW.toISOString(),
            privacyPolicyVersion: 1,
            shareAnalytics: false,
            sharePersonalizedRecommandations: false,
          }),
        ),
      ).toBe(false);
    });
  });

  describe("when analyticsOptIn feature flag is disabled (legacy)", () => {
    const legacyMockState = (settings: Partial<SettingsState>): State => ({
      ...({} as State),
      featureFlags: {
        ...FEATURE_FLAGS_INITIAL_STATE,
        resolved: {
          ...FEATURE_FLAGS_INITIAL_STATE.resolved,
          analyticsOptIn: {
            ...FEATURE_FLAGS_INITIAL_STATE.resolved.analyticsOptIn,
            enabled: false,
          },
        },
      },
      settings: {
        ...SETTINGS_INITIAL_STATE,
        ...settings,
      },
    });

    it("should track from share toggles without consent metadata", () => {
      expect(
        trackingEnabledSelector(
          legacyMockState({
            lastAnalyticsConsentDate: null,
            shareAnalytics: true,
            sharePersonalizedRecommandations: false,
          }),
        ),
      ).toBe(true);
    });

    it("should not track when both share toggles are off", () => {
      expect(
        trackingEnabledSelector(
          legacyMockState({
            lastAnalyticsConsentDate: FIXED_NOW.toISOString(),
            privacyPolicyVersion: 1,
            shareAnalytics: false,
            sharePersonalizedRecommandations: false,
          }),
        ),
      ).toBe(false);
    });
  });

  it("should fall back to share toggles when featureFlags state is missing", () => {
    expect(
      trackingEnabledSelector({
        ...({} as State),
        settings: {
          ...SETTINGS_INITIAL_STATE,
          lastAnalyticsConsentDate: null,
          shareAnalytics: true,
          sharePersonalizedRecommandations: false,
        },
      }),
    ).toBe(true);
  });
});
