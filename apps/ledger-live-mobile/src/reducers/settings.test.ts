import { DeviceModelId } from "@ledgerhq/types-devices";
import { add } from "date-fns";
import { FEATURE_FLAGS_INITIAL_STATE } from "@shared/feature-flags";
import reducer, {
  analyticsConsentInfoSelector,
  lastConnectedDeviceSelector,
  lastSeenDeviceSelector,
  productTourCompletedSelector,
  resolvedThemeSelector,
  themeSelector,
  trackingEnabledSelector,
  canPushDeviceIdsSelector,
  counterValueCurrencySelector,
  counterValueIdOf,
  migrateLegacyCryptoCounterValue,
  migrateLegacyStarredMarketCoins,
  supportedCounterValuesSelector,
  INITIAL_STATE as SETTINGS_INITIAL_STATE,
  filterValidSettings,
} from "./settings";
import { State, Theme, SettingsState } from "./types";
import { aDeviceInfoBuilder } from "@ledgerhq/live-common/mock/fixtures/aDeviceInfo";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import {
  importSettings,
  setAnalyticsConsentInfo,
  setProductTourCompleted,
  setTheme,
} from "../actions/settings";
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
 * `trackingEnabledSelector` runs the consent / policy version checks only when the
 * `analyticsOptIn` feature is resolved as enabled; otherwise it only uses the toggles.
 */
const withAnalyticsOptInResolved = (
  base: State,
  params: Partial<{ policyVersion: number | string }> = {},
  enabled = true,
): State =>
  ({
    ...base,
    featureFlags: {
      ...FEATURE_FLAGS_INITIAL_STATE,
      ...base.featureFlags,
      resolved: {
        ...FEATURE_FLAGS_INITIAL_STATE.resolved,
        ...base.featureFlags?.resolved,
        analyticsOptIn: {
          ...FEATURE_FLAGS_INITIAL_STATE.resolved.analyticsOptIn,
          ...base.featureFlags?.resolved?.analyticsOptIn,
          enabled,
          params: {
            ...FEATURE_FLAGS_INITIAL_STATE.resolved.analyticsOptIn.params,
            ...base.featureFlags?.resolved?.analyticsOptIn?.params,
            ...params,
          },
        },
      },
    },
  }) as State;

describe("trackingEnabledSelector", () => {
  /** Fixed clock so the consent dates used below do not depend on real time. */
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

  it("returns false when the stored privacy policy version is missing even though the consent date is valid", () => {
    const state = withAnalyticsOptInResolved(
      stateWithSettings({
        analyticsConsentInfo: {
          consentDate: FIXED_NOW.toISOString(),
          privacyPolicyVersion: null,
        },
        analyticsEnabled: true,
      }),
    );
    expect(trackingEnabledSelector(state)).toBe(false);
  });

  it("returns false when the stored privacy policy version cannot be parsed", () => {
    const state = withAnalyticsOptInResolved(
      stateWithSettings({
        analyticsConsentInfo: {
          consentDate: FIXED_NOW.toISOString(),
          privacyPolicyVersion: "v1",
        },
        analyticsEnabled: true,
      }),
    );
    expect(trackingEnabledSelector(state)).toBe(false);
  });

  it("returns false when consentDate parses to NaN and analytics opt-in feature is on", () => {
    const state = withAnalyticsOptInResolved(
      stateWithSettings({
        analyticsConsentInfo: {
          consentDate: "not-a-valid-date",
          privacyPolicyVersion: 1,
        },
        analyticsEnabled: true,
      }),
    );
    expect(trackingEnabledSelector(state)).toBe(false);
  });

  it("returns false when the major policy version was bumped even though consent is recent", () => {
    const state = withAnalyticsOptInResolved(
      stateWithSettings({
        analyticsConsentInfo: {
          consentDate: "2025-06-01T00:00:00.000Z",
          privacyPolicyVersion: 1,
        },
        analyticsEnabled: true,
        personalizedRecommendationsEnabled: true,
      }),
      { policyVersion: "2.0" },
    );
    expect(trackingEnabledSelector(state)).toBe(false);
  });

  it("returns true when only the minor policy version was bumped", () => {
    const state = withAnalyticsOptInResolved(
      stateWithSettings({
        analyticsConsentInfo: {
          consentDate: "2026-02-01T00:00:00.000Z",
          privacyPolicyVersion: 1,
        },
        analyticsEnabled: true,
      }),
      { policyVersion: "1.1" },
    );
    expect(trackingEnabledSelector(state)).toBe(true);
  });

  it("returns true when the current policy version is invalid and the consent date is still valid", () => {
    const state = withAnalyticsOptInResolved(
      stateWithSettings({
        analyticsConsentInfo: {
          consentDate: "2026-02-01T00:00:00.000Z",
          privacyPolicyVersion: 1,
        },
        analyticsEnabled: true,
      }),
      { policyVersion: 1.2 },
    );
    expect(trackingEnabledSelector(state)).toBe(true);
  });

  it("returns false when the current policy version is invalid and the consent date is missing", () => {
    const state = withAnalyticsOptInResolved(
      stateWithSettings({
        analyticsConsentInfo: { consentDate: null, privacyPolicyVersion: 1 },
        analyticsEnabled: true,
      }),
      { policyVersion: "v2" },
    );
    expect(trackingEnabledSelector(state)).toBe(false);
  });

  it("keeps tracking an ageing consent, since renewal is driven by policy version bumps", () => {
    const state = withAnalyticsOptInResolved(
      stateWithSettings({
        analyticsConsentInfo: {
          consentDate: add(FIXED_NOW, { days: -3650 }).toISOString(),
          privacyPolicyVersion: 1,
        },
        analyticsEnabled: true,
      }),
    );
    expect(trackingEnabledSelector(state)).toBe(true);
  });

  it("returns false when consent is valid but analytics and personalized recommendations are off and analytics opt-in feature is on", () => {
    const state = withAnalyticsOptInResolved(
      stateWithSettings({
        analyticsConsentInfo: {
          consentDate: "2026-02-01T00:00:00.000Z",
          privacyPolicyVersion: 1,
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
        privacyPolicyVersion: 1,
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
          privacyPolicyVersion: 1,
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
          privacyPolicyVersion: 1,
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

describe("canPushDeviceIdsSelector", () => {
  const FIXED_NOW = new Date("2026-03-01T12:00:00.000Z");
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(FIXED_NOW);
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  const optedInState = (): State =>
    withAnalyticsOptInResolved(
      stateWithSettings({
        analyticsConsentInfo: { consentDate: FIXED_NOW.toISOString(), privacyPolicyVersion: 1 },
        analyticsEnabled: true,
        personalizedRecommendationsEnabled: true,
      }),
    );

  it("returns false when FF is off (regardless of user opt-in)", () => {
    const state = withAnalyticsOptInResolved(
      stateWithSettings({ analyticsEnabled: true }),
      {},
      false,
    );
    expect(canPushDeviceIdsSelector(state)).toBe(false);
  });

  it("returns false when FF is on but user has not opted in", () => {
    const state = withAnalyticsOptInResolved(
      stateWithSettings({
        analyticsConsentInfo: { consentDate: FIXED_NOW.toISOString(), privacyPolicyVersion: 1 },
        analyticsEnabled: false,
        personalizedRecommendationsEnabled: false,
      }),
    );
    expect(canPushDeviceIdsSelector(state)).toBe(false);
  });

  it("returns true only when FF is on and user has opted in", () => {
    expect(canPushDeviceIdsSelector(optedInState())).toBe(true);
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

describe("analytics consent defaults", () => {
  it("should default analyticsEnabled and personalizedRecommendationsEnabled to false", () => {
    expect(SETTINGS_INITIAL_STATE.analyticsEnabled).toBe(false);
    expect(SETTINGS_INITIAL_STATE.personalizedRecommendationsEnabled).toBe(false);
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
      productTourCompleted: true,
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

  it("should import productTourCompleted when present in payload", () => {
    const action = importSettings({ productTourCompleted: true });
    const newState = reducer(SETTINGS_INITIAL_STATE, action);
    expect(newState.productTourCompleted).toBe(true);
  });

  it("preserves persisted analyticsEnabled=true (returning opted-in users not regressed)", () => {
    const action = importSettings({
      analyticsEnabled: true,
      personalizedRecommendationsEnabled: true,
    });
    const newState = reducer(SETTINGS_INITIAL_STATE, action);
    expect(newState.analyticsEnabled).toBe(true);
    expect(newState.personalizedRecommendationsEnabled).toBe(true);
  });

  it("preserves persisted analyticsEnabled=false for returning opted-out users", () => {
    const action = importSettings({
      analyticsEnabled: false,
      personalizedRecommendationsEnabled: false,
    });
    const newState = reducer(SETTINGS_INITIAL_STATE, action);
    expect(newState.analyticsEnabled).toBe(false);
    expect(newState.personalizedRecommendationsEnabled).toBe(false);
  });
});

describe("productTourCompleted setting", () => {
  it("defaults to false in initial state", () => {
    expect(SETTINGS_INITIAL_STATE.productTourCompleted).toBe(false);
  });

  it("updates via setProductTourCompleted and exposes via selector", () => {
    const after = reducer(SETTINGS_INITIAL_STATE, setProductTourCompleted(true));
    expect(after.productTourCompleted).toBe(true);
    const state = stateWithSettings({ productTourCompleted: true });
    expect(productTourCompletedSelector(state)).toBe(true);
  });

  it("can be cleared after being set", () => {
    const afterTrue = reducer(SETTINGS_INITIAL_STATE, setProductTourCompleted(true));
    const afterFalse = reducer(afterTrue, setProductTourCompleted(false));
    expect(afterFalse.productTourCompleted).toBe(false);
  });
});

describe("counterValueCurrencySelector", () => {
  const buildState = (counterValue: string): State => stateWithSettings({ counterValue });

  it("resolves a fiat counter-value by ticker", () => {
    expect(counterValueCurrencySelector(buildState("EUR"))).toBe(getFiatCurrencyByTicker("EUR"));
  });

  it("resolves a crypto counter-value by Ledger id to the CryptoCurrency", () => {
    const btc = counterValueCurrencySelector(buildState("bitcoin"));
    expect(btc).toBe(getCryptoCurrencyById("bitcoin"));
    expect(btc.type).toBe("CryptoCurrency");

    const eth = counterValueCurrencySelector(buildState("ethereum"));
    expect(eth).toBe(getCryptoCurrencyById("ethereum"));
    expect(eth.type).toBe("CryptoCurrency");
  });

  it("falls back to USD for unknown values", () => {
    expect(counterValueCurrencySelector(buildState("not-a-currency"))).toBe(
      getFiatCurrencyByTicker("USD"),
    );
  });

  it("falls back to USD for OFAC-restricted tickers (read-time guard)", () => {
    // RUB is in OFAC_FIAT_TICKERS; a persisted RUB must display as USD at read time
    // so the user never sees a blocked currency even if they had it stored.
    expect(counterValueCurrencySelector(buildState("RUB"))).toBe(getFiatCurrencyByTicker("USD"));
  });

  it("resolves a non-fallback fiat without resetting to USD (regression guard for LIVE-35110)", () => {
    // AMD (Armenian Dram) is in the domain registry but NOT in the ~36-currency
    // offline fallback list. Before this fix, booting the app would call
    // updateSupportedCountervalues against the fallback, causing AMD to be treated
    // as unsupported and silently reset to USD on every restart.
    // The selector must resolve AMD directly from the registry regardless of what
    // the supportedFiats slice currently holds.
    expect(counterValueCurrencySelector(buildState("AMD"))).toBe(getFiatCurrencyByTicker("AMD"));
  });
});

describe("counterValueIdOf", () => {
  it("returns the Ledger id for crypto currencies", () => {
    expect(counterValueIdOf(getCryptoCurrencyById("bitcoin"))).toBe("bitcoin");
    expect(counterValueIdOf(getCryptoCurrencyById("ethereum"))).toBe("ethereum");
  });

  it("returns the ticker for fiat currencies", () => {
    expect(counterValueIdOf(getFiatCurrencyByTicker("EUR"))).toBe("EUR");
  });
});

describe("migrateLegacyCryptoCounterValue", () => {
  it("migrates legacy crypto tickers to Ledger ids", () => {
    expect(migrateLegacyCryptoCounterValue("BTC")).toBe("bitcoin");
    expect(migrateLegacyCryptoCounterValue("ETH")).toBe("ethereum");
  });

  it("leaves fiat tickers and already-migrated ids untouched", () => {
    expect(migrateLegacyCryptoCounterValue("USD")).toBe("USD");
    expect(migrateLegacyCryptoCounterValue("bitcoin")).toBe("bitcoin");
  });
});

describe("migrateLegacyStarredMarketCoins", () => {
  it("migrates the legacy DAI V2 identifier", () => {
    expect(migrateLegacyStarredMarketCoins(["ethereum/erc20/dai_stablecoin_v2_0"])).toEqual([
      "dai",
    ]);
  });

  it("keeps the canonical DAI identifier unchanged", () => {
    expect(migrateLegacyStarredMarketCoins(["dai"])).toEqual(["dai"]);
  });

  it("deduplicates legacy and canonical DAI identifiers while preserving order", () => {
    expect(
      migrateLegacyStarredMarketCoins(["bitcoin", "ethereum/erc20/dai_stablecoin_v2_0", "dai"]),
    ).toEqual(["bitcoin", "dai"]);
  });
});

describe("supportedCounterValuesSelector", () => {
  const stateWithFiats = (fiats: ReturnType<typeof getFiatCurrencyByTicker>[]): State =>
    ({
      ...({} as State),
      supportedFiats: { fiats, fiatsReady: true },
    }) as State;

  it("always includes Bitcoin and Ethereum regardless of fiat list", () => {
    const result = supportedCounterValuesSelector(stateWithFiats([]));
    const tickers = result.map(r => r.ticker);
    expect(tickers).toContain("BTC");
    expect(tickers).toContain("ETH");
  });

  it("includes fiats from the supportedFiats slice", () => {
    const EUR = getFiatCurrencyByTicker("EUR");
    const USD = getFiatCurrencyByTicker("USD");
    const result = supportedCounterValuesSelector(stateWithFiats([EUR, USD]));
    const tickers = result.map(r => r.ticker);
    expect(tickers).toContain("EUR");
    expect(tickers).toContain("USD");
  });

  it("returns items sorted by currency name", () => {
    const EUR = getFiatCurrencyByTicker("EUR");
    const USD = getFiatCurrencyByTicker("USD");
    const result = supportedCounterValuesSelector(stateWithFiats([EUR, USD]));
    const names = result.map(r => r.currency.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  it("each item carries value, ticker, label and currency", () => {
    const EUR = getFiatCurrencyByTicker("EUR");
    const result = supportedCounterValuesSelector(stateWithFiats([EUR]));
    const eurItem = result.find(r => r.ticker === "EUR");
    expect(eurItem).toBeDefined();
    expect(eurItem?.value).toBe("EUR");
    expect(eurItem?.label).toContain("EUR");
    expect(eurItem?.currency).toBe(EUR);
  });

  it("is memoized — returns the same reference when called twice with the same state", () => {
    const state = stateWithFiats([getFiatCurrencyByTicker("EUR")]);
    const first = supportedCounterValuesSelector(state);
    const second = supportedCounterValuesSelector(state);
    expect(first).toBe(second);
  });
});

describe("filterValidSettings strips removed fields (self-healing on upgrade)", () => {
  it("drops stale supportedCounterValues key from persisted settings", () => {
    // Before this PR, supportedCounterValues was a persisted SettingsState field.
    // After removal from INITIAL_STATE it must be auto-stripped on import so old
    // devices don't silently carry dead data after upgrade.
    const stale = { counterValue: "EUR", supportedCounterValues: [{ value: "EUR" }] };
    const filtered = filterValidSettings(stale as unknown as Partial<SettingsState>);
    expect("supportedCounterValues" in filtered).toBe(false);
    expect(filtered.counterValue).toBe("EUR");
  });
});
