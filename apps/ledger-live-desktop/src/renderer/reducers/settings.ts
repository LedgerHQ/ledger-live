import { DeviceModelId } from "@ledgerhq/devices";
import { getBrazeCampaignCutoff } from "@ledgerhq/live-common/braze/anonymousUsers";
import {
  getCryptoCurrencyById,
  getFiatCurrencyByTicker,
  findFiatCurrencyByTicker,
  findCryptoCurrencyByTicker,
  listSupportedFiats,
  OFAC_CURRENCIES,
} from "@ledgerhq/live-common/currencies/index";
import { getEnv } from "@ledgerhq/live-env";
import { CryptoCurrency, Currency, Unit } from "@ledgerhq/types-cryptoassets";
import {
  AccountLike,
  DeviceModelInfo,
  Feature,
  FeatureId,
  FirmwareUpdateContext,
  PortfolioRange,
} from "@ledgerhq/types-live";
import { handleActions } from "redux-actions";
import { createSelector } from "reselect";
import {
  DEFAULT_LANGUAGE,
  Language,
  LanguageIds,
  LanguageIdsNotFeatureFlagged,
  Languages,
  Locale,
  OFAC_LOCALES,
} from "~/config/languages";
import { getAppLocale } from "~/helpers/systemLocale";
import regionsByKey from "~/renderer/screens/settings/sections/General/regions.json";
import { State } from ".";
import {
  PURGE_EXPIRED_ANONYMOUS_USER_NOTIFICATIONS,
  TOGGLE_MEMOTAG_INFO,
  TOGGLE_MEV,
  UPDATE_ANONYMOUS_USER_NOTIFICATIONS,
} from "../actions/constants";
import { OnboardingUseCase } from "../components/Onboarding/OnboardingUseCase";
import { Handlers } from "./types";

/* Initial state */

export type VaultSigner = {
  enabled: boolean;
  host: string;
  workspace: string;
  token: string;
};

export type SettingsState = {
  loaded: boolean;
  // is the settings loaded from db (if not we don't save them)
  hasCompletedOnboarding: boolean;
  counterValue: string;
  preferredDeviceModel: DeviceModelId;
  hasInstalledApps: boolean;
  lastSeenDevice: DeviceModelInfo | undefined | null;
  devicesModelList: DeviceModelId[];
  latestFirmware: FirmwareUpdateContext | null;
  theme: string | undefined | null;
  language: Language | undefined | null;
  locale: Locale | undefined | null;
  /** DEPRECATED, use field `locale` instead */
  region: string | undefined | null;
  orderAccounts: string;
  countervalueFirst: boolean;
  autoLockTimeout: number;
  selectedTimeRange: PortfolioRange;
  currenciesSettings: {
    [currencyId: string]: CurrencySettings;
  };
  pairExchanges: {
    [pair: string]: string | undefined | null;
  };
  developerMode: boolean;
  shareAnalytics: boolean;
  sharePersonalizedRecommandations: boolean;
  sentryLogs: boolean;
  lastUsedVersion: string;
  dismissedBanners: string[];
  accountsViewMode: "card" | "list";
  showAccountsHelperBanner: boolean;
  mevProtection: boolean;
  hideEmptyTokenAccounts: boolean;
  filterTokenOperationsZeroAmount: boolean;
  sidebarCollapsed: boolean;
  discreetMode: boolean;
  starredAccountIds?: string[];
  blacklistedTokenIds: string[];
  deepLinkUrl: string | undefined | null;
  lastSeenCustomImage: {
    size: number;
    hash: string;
  };
  firstTimeLend: boolean;
  showClearCacheBanner: boolean;
  // developer settings
  allowDebugApps: boolean;
  allowReactQueryDebug: boolean;
  allowExperimentalApps: boolean;
  enablePlatformDevTools: boolean;
  catalogProvider: string;
  USBTroubleshootingIndex?: number;
  enableLearnPageStagingUrl?: boolean;
  swap: {
    hasAcceptedIPSharing: boolean;
    selectableCurrencies: string[];
    acceptedProviders: string[];
  };
  overriddenFeatureFlags: {
    [key in FeatureId]: Feature;
  };
  featureFlagsButtonVisible: boolean;
  vaultSigner: VaultSigner;
  supportedCounterValues: SupportedCountervaluesData[];
  hasSeenAnalyticsOptInPrompt: boolean;
  dismissedContentCards: { [key: string]: number };
  anonymousBrazeId: string | null;
  starredMarketCoins: string[];
  hasBeenUpsoldRecover: boolean;
  hasBeenRedirectedToPostOnboarding: boolean;
  onboardingUseCase: OnboardingUseCase | null;
  lastOnboardedDevice: Device | null;
  alwaysShowMemoTagInfo: boolean;
  anonymousUserNotifications: { LNSUpsell?: number } & Record<string, number>;
  hasSeenWalletV4Tour: boolean;
  doNotAskAgainSkipMemo: boolean;
};

export const getInitialLanguageAndLocale = (): { language: Language; locale: Locale } => {
  const systemLocal = getAppLocale();

  // Find language from system locale (i.e., en, fr, es ...)
  const languageId = LanguageIdsNotFeatureFlagged.find(lang => systemLocal.startsWith(lang));

  // If language found, try to find corresponding locale
  if (languageId) {
    // const localeId = Languages[languageId].locales.find(lang => systemLocal.startsWith(lang));
    // TODO Hack because the typing on the commented line above doesn't work
    const languageLocales = Languages[languageId].locales;

    const localeId = languageLocales.find(lang => systemLocal.startsWith(lang));

    // If locale matched returns it, if not returns the default locale of the language
    if (localeId) return { language: languageId, locale: localeId };
    return { language: languageId, locale: Languages[languageId].locales.default };
  }

  // If nothing found returns default language and locale
  return { language: DEFAULT_LANGUAGE.id, locale: DEFAULT_LANGUAGE.locales.default };
};

export const INITIAL_STATE: SettingsState = {
  hasCompletedOnboarding: false,
  counterValue: "USD",
  ...getInitialLanguageAndLocale(),
  theme: null,
  region: null,
  orderAccounts: "balance|desc",
  countervalueFirst: false,
  autoLockTimeout: 10,
  selectedTimeRange: "day",
  currenciesSettings: {},
  pairExchanges: {},
  developerMode: !!process.env.__DEV__,
  loaded: false,
  shareAnalytics: true,
  sharePersonalizedRecommandations: true,
  hasSeenAnalyticsOptInPrompt: false,
  sentryLogs: true,
  lastUsedVersion: __APP_VERSION__,
  dismissedBanners: [],
  accountsViewMode: "list",
  showAccountsHelperBanner: true,
  hideEmptyTokenAccounts: getEnv("HIDE_EMPTY_TOKEN_ACCOUNTS"),
  filterTokenOperationsZeroAmount: getEnv("FILTER_ZERO_AMOUNT_ERC20_EVENTS"),
  sidebarCollapsed: false,
  discreetMode: false,
  preferredDeviceModel: DeviceModelId.nanoS,
  hasInstalledApps: true,
  lastSeenDevice: null,
  mevProtection: true,
  devicesModelList: [],
  lastSeenCustomImage: {
    size: 0,
    hash: "",
  },
  latestFirmware: null,
  blacklistedTokenIds: [],
  deepLinkUrl: null,
  firstTimeLend: false,
  showClearCacheBanner: false,
  // developer settings
  allowDebugApps: false,
  allowReactQueryDebug: false,
  allowExperimentalApps: false,
  enablePlatformDevTools: false,
  catalogProvider: "production",
  enableLearnPageStagingUrl: false,
  USBTroubleshootingIndex: undefined,
  swap: {
    hasAcceptedIPSharing: false,
    acceptedProviders: [],
    selectableCurrencies: [],
  },
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  overriddenFeatureFlags: {} as Record<FeatureId, Feature>,
  featureFlagsButtonVisible: false,

  // Vault
  vaultSigner: { enabled: false, host: "", token: "", workspace: "" },
  supportedCounterValues: [],
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  dismissedContentCards: {} as Record<string, number>,
  anonymousBrazeId: null,

  //Market
  starredMarketCoins: [],

  hasBeenUpsoldRecover: true, // will be set to false at the end of an onboarding, not false by default to avoid upsell for existing users
  hasBeenRedirectedToPostOnboarding: true, // will be set to false at the end of an onboarding, not false by default to avoid redirection for existing users
  onboardingUseCase: null,
  lastOnboardedDevice: null,
  alwaysShowMemoTagInfo: true,
  anonymousUserNotifications: {},
  hasSeenWalletV4Tour: false,
  doNotAskAgainSkipMemo: false,
};

/* Handlers */

type HandlersPayloads = {
  SAVE_SETTINGS: Partial<SettingsState>;
  FETCH_SETTINGS: Partial<SettingsState>;
  SETTINGS_DISMISS_BANNER: string;
  SHOW_TOKEN: string;
  BLACKLIST_TOKEN: string;
  LAST_SEEN_DEVICE_INFO: {
    lastSeenDevice: DeviceModelInfo;
    latestFirmware: FirmwareUpdateContext;
  };
  LAST_SEEN_DEVICE: DeviceModelInfo;
  ADD_NEW_DEVICE_MODEL: DeviceModelId;
  SET_DEEPLINK_URL: string | null | undefined;
  SET_LAST_SEEN_CUSTOM_IMAGE: {
    imageSize: number;
    imageHash: string;
  };
  SET_OVERRIDDEN_FEATURE_FLAG: {
    key: FeatureId;
    value: Feature;
  };
  SET_OVERRIDDEN_FEATURE_FLAGS: {
    overriddenFeatureFlags: {
      [key in FeatureId]: Feature;
    };
  };
  SET_FEATURE_FLAGS_BUTTON_VISIBLE: {
    featureFlagsButtonVisible: boolean;
  };
  SET_VAULT_SIGNER: VaultSigner;
  SET_SUPPORTED_COUNTER_VALUES: SupportedCountervaluesData[];
  SET_HAS_SEEN_ANALYTICS_OPT_IN_PROMPT: boolean;
  SET_DISMISSED_CONTENT_CARDS: {
    [key: string]: number;
  };
  CLEAR_DISMISSED_CONTENT_CARDS: { now: Date };
  SET_ANONYMOUS_BRAZE_ID: string;
  SET_CURRENCY_SETTINGS: { key: string; value: CurrencySettings };

  MARKET_ADD_STARRED_COINS: string;
  MARKET_REMOVE_STARRED_COINS: string;

  SET_HAS_BEEN_UPSOLD_RECOVER: boolean;
  SET_ONBOARDING_USE_CASE: OnboardingUseCase;
  SET_HAS_REDIRECTED_TO_POST_ONBOARDING: boolean;
  SET_LAST_ONBOARDED_DEVICE: Device | null;

  [PURGE_EXPIRED_ANONYMOUS_USER_NOTIFICATIONS]: { now: Date };
  [TOGGLE_MEV]: boolean;
  [TOGGLE_MEMOTAG_INFO]: boolean;
  [UPDATE_ANONYMOUS_USER_NOTIFICATIONS]: {
    notifications: Record<string, number>;
  };
  SET_HAS_SEEN_WALLET_V4_TOUR: boolean;
};
type SettingsHandlers<PreciseKey = true> = Handlers<SettingsState, HandlersPayloads, PreciseKey>;

/**
 * Filters imported settings to only include valid SettingsState keys.
 * This prevents unknown/obsolete fields (like nftCollectionsStatusByNetwork) from being imported.
 */
function isValidSettingsKey(key: string): key is keyof SettingsState {
  return key in INITIAL_STATE;
}

export function filterValidSettings(
  importedSettings: Partial<SettingsState>,
): Partial<SettingsState> {
  const validKeys = new Set<string>(Object.keys(INITIAL_STATE));

  return Object.fromEntries(
    Object.entries(importedSettings).filter(
      ([key]) => validKeys.has(key) && isValidSettingsKey(key),
    ),
  ) as Partial<SettingsState>;
}

const handlers: SettingsHandlers = {
  SAVE_SETTINGS: (state, { payload }) => {
    if (!payload) return state;
    const filteredPayload = filterValidSettings(payload);
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const changed = (Object.keys(filteredPayload) as (keyof typeof filteredPayload)[]).some(
      key => filteredPayload[key] !== state[key],
    );
    if (!changed) return state;
    return {
      ...state,
      ...filteredPayload,
    };
  },
  FETCH_SETTINGS: (state, { payload: settings }) => {
    const filteredSettings = filterValidSettings(settings);
    return {
      ...state,
      ...filteredSettings,
      loaded: true,
    };
  },
  SETTINGS_DISMISS_BANNER: (state, { payload: bannerId }) => ({
    ...state,
    dismissedBanners: [...state.dismissedBanners, bannerId],
  }),
  SHOW_TOKEN: (state, { payload: tokenId }) => {
    const ids = state.blacklistedTokenIds;
    return {
      ...state,
      blacklistedTokenIds: ids.filter(id => id !== tokenId),
    };
  },
  BLACKLIST_TOKEN: (state, { payload: tokenId }) => {
    const ids = state.blacklistedTokenIds;
    return {
      ...state,
      blacklistedTokenIds: [...new Set([...ids, tokenId])],
    };
  },
  LAST_SEEN_DEVICE_INFO: (state, { payload }) => ({
    ...state,
    lastSeenDevice: Object.assign({}, state.lastSeenDevice, payload.lastSeenDevice),
    latestFirmware: payload.latestFirmware,
  }),
  LAST_SEEN_DEVICE: (state, { payload }) => ({
    ...state,
    lastSeenDevice: state.lastSeenDevice
      ? {
          ...state.lastSeenDevice,
          deviceInfo: payload.deviceInfo,
        }
      : undefined,
  }),

  ADD_NEW_DEVICE_MODEL: (state, { payload }) => ({
    ...state,
    devicesModelList: [...new Set(state.devicesModelList.concat(payload))],
  }),

  SET_DEEPLINK_URL: (state, { payload: deepLinkUrl }) => ({
    ...state,
    deepLinkUrl,
  }),
  SET_LAST_SEEN_CUSTOM_IMAGE: (state: SettingsState, { payload }) => ({
    ...state,
    lastSeenCustomImage: {
      size: payload.imageSize,
      hash: payload.imageHash,
    },
  }),
  SET_CURRENCY_SETTINGS: (state: SettingsState, { payload }) => ({
    ...state,
    currenciesSettings: {
      ...state.currenciesSettings,
      [payload.key]: payload.value,
    },
  }),
  SET_OVERRIDDEN_FEATURE_FLAG: (state: SettingsState, { payload }) => ({
    ...state,
    overriddenFeatureFlags: {
      ...state.overriddenFeatureFlags,
      [payload.key]: payload.value,
    },
  }),
  SET_OVERRIDDEN_FEATURE_FLAGS: (state: SettingsState, { payload }) => ({
    ...state,
    overriddenFeatureFlags: payload.overriddenFeatureFlags,
  }),
  SET_FEATURE_FLAGS_BUTTON_VISIBLE: (state: SettingsState, { payload }) => ({
    ...state,
    featureFlagsButtonVisible: payload.featureFlagsButtonVisible,
  }),
  SET_VAULT_SIGNER: (state: SettingsState, { payload }) => ({
    ...state,
    vaultSigner: payload,
  }),
  SET_SUPPORTED_COUNTER_VALUES: (state: SettingsState, { payload }) => {
    let activeCounterValue = state.counterValue;
    if (
      activeCounterValue &&
      !payload.find(({ currency }) => currency.ticker === activeCounterValue)
    ) {
      activeCounterValue = INITIAL_STATE.counterValue;
    }
    return {
      ...state,
      supportedCounterValues: payload,
      counterValue: activeCounterValue,
    };
  },
  SET_HAS_SEEN_ANALYTICS_OPT_IN_PROMPT: (state: SettingsState, { payload }) => ({
    ...state,
    hasSeenAnalyticsOptInPrompt: payload,
  }),
  SET_DISMISSED_CONTENT_CARDS: (state: SettingsState, { payload }) => ({
    ...state,
    dismissedContentCards: {
      ...state.dismissedContentCards,
      [payload.id]: payload.timestamp,
    },
  }),

  CLEAR_DISMISSED_CONTENT_CARDS: (state: SettingsState, { payload: { now } }) => {
    const cutoff = getBrazeCampaignCutoff(now);

    const prev = state.dismissedContentCards;
    const next = Object.fromEntries(Object.entries(prev).filter(([, ts]) => ts >= cutoff));

    return Object.keys(next).length === Object.keys(prev).length
      ? state
      : { ...state, dismissedContentCards: next };
  },
  SET_ANONYMOUS_BRAZE_ID: (state: SettingsState, { payload }) => ({
    ...state,
    anonymousBrazeId: payload,
  }),

  MARKET_ADD_STARRED_COINS: (state: SettingsState, { payload }) => ({
    ...state,
    starredMarketCoins: [...state.starredMarketCoins, payload],
  }),
  MARKET_REMOVE_STARRED_COINS: (state: SettingsState, { payload }) => ({
    ...state,
    starredMarketCoins: state.starredMarketCoins.filter(id => id !== payload),
  }),
  SET_HAS_BEEN_UPSOLD_RECOVER: (state: SettingsState, { payload }) => ({
    ...state,
    hasBeenUpsoldRecover: payload,
  }),
  SET_ONBOARDING_USE_CASE: (state: SettingsState, { payload }) => ({
    ...state,
    onboardingUseCase: payload,
  }),
  SET_HAS_REDIRECTED_TO_POST_ONBOARDING: (state: SettingsState, { payload }) => ({
    ...state,
    hasBeenRedirectedToPostOnboarding: payload,
  }),
  SET_LAST_ONBOARDED_DEVICE: (state: SettingsState, { payload }) => ({
    ...state,
    lastOnboardedDevice: payload,
  }),

  [PURGE_EXPIRED_ANONYMOUS_USER_NOTIFICATIONS]: (state, { payload: { now } }) => {
    const { LNSUpsell, ...rest } = state.anonymousUserNotifications;
    const cutoff = getBrazeCampaignCutoff(now);
    const next: typeof rest = {
      ...(LNSUpsell ? { LNSUpsell } : {}),
      ...Object.fromEntries(Object.entries(rest).filter(([_, ts]) => ts >= cutoff)),
    };

    return Object.keys(next).length === Object.keys(state.anonymousUserNotifications).length
      ? state
      : { ...state, anonymousUserNotifications: next };
  },
  [TOGGLE_MEV]: (state: SettingsState, { payload }) => ({
    ...state,
    mevProtection: payload,
  }),
  [TOGGLE_MEMOTAG_INFO]: (state: SettingsState, { payload }) => ({
    ...state,
    alwaysShowMemoTagInfo: payload,
  }),
  [UPDATE_ANONYMOUS_USER_NOTIFICATIONS]: (
    state: SettingsState,
    { payload: { notifications } },
  ) => ({
    ...state,
    anonymousUserNotifications: {
      ...state.anonymousUserNotifications,
      ...notifications,
    },
  }),
  SET_HAS_SEEN_WALLET_V4_TOUR: (state: SettingsState, { payload }) => ({
    ...state,
    hasSeenWalletV4Tour: payload,
  }),
};

export default handleActions<SettingsState, HandlersPayloads[keyof HandlersPayloads]>(
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  handlers as unknown as SettingsHandlers<false>,
  INITIAL_STATE,
);

/* Selectors */

export type CurrencySettings = {
  confirmationsNb: number;
  unit: Unit;
};

type ConfirmationDefaults = {
  confirmationsNb:
    | {
        min: number;
        def: number;
        max: number;
      }
    | undefined
    | null;
};

type UnitDefaults = {
  unit: Unit;
};

export const currencySettingsDefaults = (c: Currency): ConfirmationDefaults & UnitDefaults => {
  let confirmationsNb;
  if (c.type === "CryptoCurrency") {
    const { blockAvgTime } = c;
    if (blockAvgTime) {
      const def = Math.ceil((30 * 60) / blockAvgTime); // 30 min approx validation
      confirmationsNb = {
        min: 1,
        def,
        max: 3 * def,
      };
    }
  }

  return {
    confirmationsNb,
    unit: c.units[0],
  };
};
const bitcoin = getCryptoCurrencyById("bitcoin");
const ethereum = getCryptoCurrencyById("ethereum");
export const possibleIntermediaries = [bitcoin, ethereum];

export type LangAndRegion = {
  language: string;
  region: string | undefined | null;
  useSystem: boolean;
};
const defaultsForCurrency: (a: Currency) => CurrencySettings = crypto => {
  const defaults = currencySettingsDefaults(crypto);
  return {
    confirmationsNb: defaults.confirmationsNb ? defaults.confirmationsNb.def : 0,
    unit: defaults.unit,
  };
};

export type SupportedCountervaluesData = {
  value: string;
  label: string;
  currency: Currency;
};

export const getsupportedCountervalues = async (): Promise<SupportedCountervaluesData[]> => {
  const supportedFiats = await listSupportedFiats();
  const data = [...supportedFiats, ...possibleIntermediaries]
    .map(currency => ({
      value: currency.ticker,
      label: `${currency.name} - ${currency.ticker}`,
      currency,
    }))
    .sort((a, b) => (a.currency.name < b.currency.name ? -1 : 1));
  return data;
};
// TODO refactor selectors to *Selector naming convention

export const settingsStoreSelector = (state: State): SettingsState => state.settings;
export const discreetModeSelector = (state: State): boolean => state.settings.discreetMode === true;
export const lastSeenCustomImageSelector = (state: State) => state.settings.lastSeenCustomImage;
export const deepLinkUrlSelector = (state: State) => state.settings.deepLinkUrl;
export const counterValueCurrencyLocalSelector = (state: SettingsState): Currency => {
  if (OFAC_CURRENCIES.includes(state.counterValue)) {
    return getFiatCurrencyByTicker("USD");
  }
  return (
    findFiatCurrencyByTicker(state.counterValue) ||
    findCryptoCurrencyByTicker(state.counterValue) ||
    getFiatCurrencyByTicker("USD")
  );
};

export const counterValueCurrencySelector = createSelector(
  settingsStoreSelector,
  counterValueCurrencyLocalSelector,
);
export const countervalueFirstSelector = createSelector(
  settingsStoreSelector,
  s => s.countervalueFirst,
);
export const developerModeSelector = (state: State): boolean => state.settings.developerMode;
export const lastUsedVersionSelector = (state: State): string => state.settings.lastUsedVersion;
export const userThemeSelector = (state: State): "dark" | "light" | undefined | null => {
  const savedVal = state.settings.theme;
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return ["dark", "light"].includes(savedVal as string) ? (savedVal as "dark" | "light") : "dark";
};

type LanguageAndUseSystemLanguage = {
  language: Language;
};

const languageAndUseSystemLangSelector = (state: State): LanguageAndUseSystemLanguage => {
  const { language } = state.settings;
  if (language && LanguageIds.includes(language)) {
    return {
      language,
    };
  } else {
    return {
      language: getInitialLanguageAndLocale().language,
    };
  }
};

/** Use this for translations */
export const languageSelector = createSelector(languageAndUseSystemLangSelector, o => o.language);

const isValidRegionLocale = (locale: string) => {
  return regionsByKey.hasOwnProperty(locale);
};
const localeFallbackToLanguageSelector = (
  state: State,
): {
  locale: string;
} => {
  const { language, locale, region } = state.settings;
  const localeWithoutOFAC = locale && OFAC_LOCALES.includes(locale) ? "en-US" : locale;
  if (!localeWithoutOFAC && language) {
    /*
      Handle settings data saved with the old logic, where the region settings'
        entire locale was not being saved (the locale was split in 2 strings on
        "-" and only the 2nd part was saved)
        e.g: for "fr-BE" we would only save {region: "BE"}
    */
    const potentialLocale = region ? `${language}-${region}` : language;
    if (isValidRegionLocale(potentialLocale))
      return {
        locale: potentialLocale,
      };
  } else if (localeWithoutOFAC && isValidRegionLocale(localeWithoutOFAC))
    return {
      locale: localeWithoutOFAC,
    };
  return {
    locale: language || DEFAULT_LANGUAGE.locales.default,
  };
};

/** Use this for number and dates formatting. */
export const localeSelector = createSelector(
  localeFallbackToLanguageSelector,
  o => o.locale || getInitialLanguageAndLocale().locale,
);
export const getOrderAccounts = (state: State) => state.settings.orderAccounts;
export const areSettingsLoaded = (state: State) => state.settings.loaded;
export const currencySettingsLocaleSelector = (
  settings: SettingsState,
  currency: Currency,
): CurrencySettings => {
  const currencySettings = Object.keys(settings.currenciesSettings)?.includes(currency.ticker)
    ? settings.currenciesSettings[currency.ticker]
    : {};

  return {
    ...defaultsForCurrency(currency),
    ...currencySettings,
  };
};

export const confirmationsNbForCurrencySelector = (
  state: State,
  {
    currency,
  }: {
    currency: CryptoCurrency;
  },
): number => {
  const obj = state.settings.currenciesSettings[currency.ticker];
  if (obj) return obj.confirmationsNb;
  const defs = currencySettingsDefaults(currency);
  return defs.confirmationsNb ? defs.confirmationsNb.def : 0;
};

export const unitForCurrencySelector = (
  state: State,
  {
    currency,
  }: {
    currency: CryptoCurrency;
  },
): Unit => {
  const obj = state.settings.currenciesSettings[currency.ticker];
  if (obj?.unit) return obj.unit;
  const defs = currencySettingsDefaults(currency);
  return defs.unit;
};

export const accountUnitSelector = (state: State, account: AccountLike): Unit => {
  if (account.type === "Account") {
    return unitForCurrencySelector(state, account);
  } else {
    return account.token.units[0];
  }
};

export const preferredDeviceModelSelector = (state: State) => state.settings.preferredDeviceModel;
export const sidebarCollapsedSelector = (state: State) => state.settings.sidebarCollapsed;
export const accountsViewModeSelector = (state: State) => state.settings.accountsViewMode;
export const sentryLogsSelector = (state: State) => state.settings.sentryLogs;
export const autoLockTimeoutSelector = (state: State) => state.settings.autoLockTimeout;
export const shareAnalyticsSelector = (state: State) => state.settings.shareAnalytics;
export const sharePersonalizedRecommendationsSelector = (state: State) =>
  state.settings.sharePersonalizedRecommandations;
export const trackingEnabledSelector = createSelector(
  settingsStoreSelector,
  s => s.shareAnalytics || s.sharePersonalizedRecommandations,
);
export const selectedTimeRangeSelector = (state: State) => state.settings.selectedTimeRange;
export const hasInstalledAppsSelector = (state: State) => state.settings.hasInstalledApps;
export const USBTroubleshootingIndexSelector = (state: State) =>
  state.settings.USBTroubleshootingIndex;
export const allowDebugAppsSelector = (state: State) => state.settings.allowDebugApps;
export const allowDebugReactQuerySelector = (state: State) => state.settings.allowReactQueryDebug;
export const allowExperimentalAppsSelector = (state: State) => state.settings.allowExperimentalApps;
export const enablePlatformDevToolsSelector = (state: State) =>
  state.settings.enablePlatformDevTools;
export const catalogProviderSelector = (state: State) => state.settings.catalogProvider;
export const enableLearnPageStagingUrlSelector = (state: State) =>
  state.settings.enableLearnPageStagingUrl;
export const blacklistedTokenIdsSelector = (state: State) => state.settings.blacklistedTokenIds;
export const hasCompletedOnboardingSelector = (state: State) =>
  state.settings.hasCompletedOnboarding || getEnv("SKIP_ONBOARDING");
export const dismissedBannersSelector = (state: State) => state.settings.dismissedBanners || [];
export const hideEmptyTokenAccountsSelector = (state: State) =>
  state.settings.hideEmptyTokenAccounts;
export const filterTokenOperationsZeroAmountSelector = (state: State) =>
  state.settings.filterTokenOperationsZeroAmount;

export const doNotAskAgainSkipMemoSelector = (state: State) => state.settings.doNotAskAgainSkipMemo;
export const lastSeenDeviceSelector = (state: State): DeviceModelInfo | null | undefined => {
  const { lastSeenDevice } = state.settings;
  if (!lastSeenDevice || !Object.values(DeviceModelId).includes(lastSeenDevice.modelId))
    return null;
  return lastSeenDevice;
};
export const devicesModelListSelector = (state: State): DeviceModelId[] =>
  state.settings.devicesModelList;
export const latestFirmwareSelector = (state: State) => state.settings.latestFirmware;
export const swapSelectableCurrenciesSelector = (state: State) =>
  state.settings.swap.selectableCurrencies;
export const showClearCacheBannerSelector = (state: State) => state.settings.showClearCacheBanner;
export const overriddenFeatureFlagsSelector = (state: State) =>
  state.settings.overriddenFeatureFlags;
export const featureFlagsButtonVisibleSelector = (state: State) =>
  state.settings.featureFlagsButtonVisible;
export const vaultSignerSelector = (state: State) => state.settings.vaultSigner;
export const supportedCounterValuesSelector = (state: State) =>
  state.settings.supportedCounterValues;
export const hasSeenAnalyticsOptInPromptSelector = (state: State) =>
  state.settings.hasSeenAnalyticsOptInPrompt;
export const dismissedContentCardsSelector = (state: State) => state.settings.dismissedContentCards;
export const anonymousBrazeIdSelector = (state: State) => state.settings.anonymousBrazeId;

export const starredMarketCoinsSelector = (state: State) => state.settings.starredMarketCoins;
export const hasBeenUpsoldRecoverSelector = (state: State) => state.settings.hasBeenUpsoldRecover;
export const onboardingUseCaseSelector = (state: State) => state.settings.onboardingUseCase;
export const hasBeenRedirectedToPostOnboardingSelector = (state: State) =>
  state.settings.hasBeenRedirectedToPostOnboarding;
export const lastOnboardedDeviceSelector = (state: State) => state.settings.lastOnboardedDevice;

export const mevProtectionSelector = (state: State) => state.settings.mevProtection;
export const alwaysShowMemoTagInfoSelector = (state: State) => state.settings.alwaysShowMemoTagInfo;
export const anonymousUserNotificationsSelector = (state: State) =>
  state.settings.anonymousUserNotifications;
export const hasSeenWalletV4TourSelector = (state: State) => state.settings.hasSeenWalletV4Tour;
