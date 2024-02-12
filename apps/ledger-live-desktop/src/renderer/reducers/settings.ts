import { handleActions } from "redux-actions";
import { createSelector } from "reselect";
import {
  findCurrencyByTicker,
  getCryptoCurrencyById,
  listSupportedFiats,
  getFiatCurrencyByTicker,
} from "@ledgerhq/live-common/currencies/index";
import { DeviceModelId } from "@ledgerhq/devices";
import {
  DeviceModelInfo,
  FeatureId,
  Feature,
  PortfolioRange,
  FirmwareUpdateContext,
} from "@ledgerhq/types-live";
import { CryptoCurrency, Currency } from "@ledgerhq/types-cryptoassets";
import { getEnv } from "@ledgerhq/live-env";
import {
  LanguageIds,
  Languages,
  Language,
  Locale,
  DEFAULT_LANGUAGE,
  Locales,
} from "~/config/languages";
import { State } from ".";
import regionsByKey from "~/renderer/screens/settings/sections/General/regions.json";
import { getSystemLocale } from "~/helpers/systemLocale";
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
  sentryLogs: boolean;
  lastUsedVersion: string;
  dismissedBanners: string[];
  accountsViewMode: "card" | "list";
  nftsViewMode: "grid" | "list";
  showAccountsHelperBanner: boolean;
  hideEmptyTokenAccounts: boolean;
  filterTokenOperationsZeroAmount: boolean;
  sidebarCollapsed: boolean;
  discreetMode: boolean;
  starredAccountIds?: string[];
  blacklistedTokenIds: string[];
  hiddenNftCollections: string[];
  deepLinkUrl: string | undefined | null;
  lastSeenCustomImage: {
    size: number;
    hash: string;
  };
  firstTimeLend: boolean;
  showClearCacheBanner: boolean;
  fullNodeEnabled: boolean;
  // developer settings
  allowDebugApps: boolean;
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
  starredMarketCoins: string[];
  overriddenFeatureFlags: {
    [key in FeatureId]: Feature;
  };
  featureFlagsButtonVisible: boolean;
  vaultSigner: VaultSigner;
  supportedCounterValues: SupportedCountervaluesData[];
};

export const getInitialLanguageAndLocale = (): { language: Language; locale: Locale } => {
  const systemLocal = getSystemLocale();

  // Find language from system locale (i.e., en, fr, es ...)
  const languageId = LanguageIds.find(lang => systemLocal.startsWith(lang));

  // If language found, try to find corresponding locale
  if (languageId) {
    // const localeId = Languages[languageId].locales.find(lang => systemLocal.startsWith(lang));
    // TODO Hack because the typing on the commented line above doesn't work
    const languageLocales = Languages[languageId].locales as Locales;

    const localeId = languageLocales.find(lang => systemLocal.startsWith(lang));

    // If locale matched returns it, if not returns the default locale of the language
    if (localeId) return { language: languageId, locale: localeId };
    return { language: languageId, locale: Languages[languageId].locales.default };
  }

  // If nothing found returns default language and locale
  return { language: DEFAULT_LANGUAGE.id, locale: DEFAULT_LANGUAGE.locales.default };
};

const INITIAL_STATE: SettingsState = {
  hasCompletedOnboarding: false,
  counterValue: "USD",
  ...getInitialLanguageAndLocale(),
  theme: null,
  region: null,
  orderAccounts: "balance|desc",
  countervalueFirst: false,
  autoLockTimeout: 10,
  selectedTimeRange: "month",
  currenciesSettings: {},
  pairExchanges: {},
  developerMode: !!process.env.__DEV__,
  loaded: false,
  shareAnalytics: true,
  sentryLogs: true,
  lastUsedVersion: __APP_VERSION__,
  dismissedBanners: [],
  accountsViewMode: "list",
  nftsViewMode: "list",
  showAccountsHelperBanner: true,
  hideEmptyTokenAccounts: getEnv("HIDE_EMPTY_TOKEN_ACCOUNTS"),
  filterTokenOperationsZeroAmount: getEnv("FILTER_ZERO_AMOUNT_ERC20_EVENTS"),
  sidebarCollapsed: false,
  discreetMode: false,
  preferredDeviceModel: DeviceModelId.nanoS,
  hasInstalledApps: true,
  lastSeenDevice: null,
  devicesModelList: [],
  lastSeenCustomImage: {
    size: 0,
    hash: "",
  },
  latestFirmware: null,
  blacklistedTokenIds: [],
  hiddenNftCollections: [],
  deepLinkUrl: null,
  firstTimeLend: false,
  showClearCacheBanner: false,
  fullNodeEnabled: false,
  // developer settings
  allowDebugApps: false,
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
  starredMarketCoins: [],
  overriddenFeatureFlags: {} as Record<FeatureId, Feature>,
  featureFlagsButtonVisible: false,

  // Vault
  vaultSigner: { enabled: false, host: "", token: "", workspace: "" },
  supportedCounterValues: [],
};

/* Handlers */

type HandlersPayloads = {
  SETTINGS_SET_PAIRS: Array<{
    from: Currency;
    to: Currency;
    exchange: string;
  }>;
  SAVE_SETTINGS: Partial<SettingsState>;
  FETCH_SETTINGS: Partial<SettingsState>;
  SETTINGS_DISMISS_BANNER: string;
  SHOW_TOKEN: string;
  BLACKLIST_TOKEN: string;
  UNHIDE_NFT_COLLECTION: string;
  HIDE_NFT_COLLECTION: string;
  LAST_SEEN_DEVICE_INFO: {
    lastSeenDevice: DeviceModelInfo;
    latestFirmware: FirmwareUpdateContext;
  };
  LAST_SEEN_DEVICE: DeviceModelInfo;
  ADD_NEW_DEVICE_MODEL: DeviceModelId;
  SET_DEEPLINK_URL: string | null | undefined;
  SET_FIRST_TIME_LEND: never;
  SET_SWAP_SELECTABLE_CURRENCIES: string[];
  SET_SWAP_ACCEPTED_IP_SHARING: boolean;
  ACCEPT_SWAP_PROVIDER: string;
  DEBUG_TICK: never;
  ADD_STARRED_MARKET_COINS: string;
  REMOVE_STARRED_MARKET_COINS: string;
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
};
type SettingsHandlers<PreciseKey = true> = Handlers<SettingsState, HandlersPayloads, PreciseKey>;

const handlers: SettingsHandlers = {
  SETTINGS_SET_PAIRS: (state, { payload: pairs }) => {
    const copy = {
      ...state,
    };
    copy.pairExchanges = {
      ...copy.pairExchanges,
    };
    for (const { to, from, exchange } of pairs) {
      copy.pairExchanges[pairHash(from, to)] = exchange;
    }
    return copy;
  },
  SAVE_SETTINGS: (state, { payload }) => {
    if (!payload) return state;
    const changed = (Object.keys(payload) as (keyof typeof payload)[]).some(
      key => payload[key] !== state[key],
    );
    if (!changed) return state;
    return {
      ...state,
      ...payload,
    };
  },
  FETCH_SETTINGS: (state, { payload: settings }) => {
    return {
      ...state,
      ...settings,
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
  UNHIDE_NFT_COLLECTION: (state, { payload: collectionId }) => {
    const ids = state.hiddenNftCollections;
    return {
      ...state,
      hiddenNftCollections: ids.filter(id => id !== collectionId),
    };
  },
  HIDE_NFT_COLLECTION: (state, { payload: collectionId }) => {
    const collections = state.hiddenNftCollections;
    return {
      ...state,
      hiddenNftCollections: [...collections, collectionId],
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
  SET_FIRST_TIME_LEND: state => ({
    ...state,
    firstTimeLend: false,
  }),
  SET_SWAP_SELECTABLE_CURRENCIES: (state, { payload }) => ({
    ...state,
    swap: {
      ...state.swap,
      selectableCurrencies: payload,
    },
  }),
  SET_SWAP_ACCEPTED_IP_SHARING: (state: SettingsState, { payload }) => ({
    ...state,
    swap: {
      ...state.swap,
      hasAcceptedIPSharing: payload,
    },
  }),
  ACCEPT_SWAP_PROVIDER: (state: SettingsState, { payload }) => ({
    ...state,
    swap: {
      ...state.swap,
      acceptedProviders: [...new Set([...(state.swap?.acceptedProviders || []), payload])],
    },
  }),
  // used to debug performance of redux updates
  DEBUG_TICK: state => ({
    ...state,
  }),
  ADD_STARRED_MARKET_COINS: (state: SettingsState, { payload }) => ({
    ...state,
    starredMarketCoins: [...state.starredMarketCoins, payload],
  }),
  REMOVE_STARRED_MARKET_COINS: (state: SettingsState, { payload }) => ({
    ...state,
    starredMarketCoins: state.starredMarketCoins.filter(id => id !== payload),
  }),
  SET_LAST_SEEN_CUSTOM_IMAGE: (state: SettingsState, { payload }) => ({
    ...state,
    lastSeenCustomImage: {
      size: payload.imageSize,
      hash: payload.imageHash,
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
};
export default handleActions<SettingsState, HandlersPayloads[keyof HandlersPayloads]>(
  handlers as unknown as SettingsHandlers<false>,
  INITIAL_STATE,
);

const pairHash = (from: Currency, to: Currency) => `${from.ticker}_${to.ticker}`;

/* Selectors */

export type CurrencySettings = {
  confirmationsNb: number;
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

export const currencySettingsDefaults = (c: Currency): ConfirmationDefaults => {
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
  };
};
const bitcoin = getCryptoCurrencyById("bitcoin");
const ethereum = getCryptoCurrencyById("ethereum");
export const possibleIntermediaries = [bitcoin, ethereum];
export const timeRangeDaysByKey = {
  day: 1,
  week: 7,
  month: 30,
  year: 365,
  all: -1,
};
export type LangAndRegion = {
  language: string;
  region: string | undefined | null;
  useSystem: boolean;
};
const defaultsForCurrency: (a: Currency) => CurrencySettings = crypto => {
  const defaults = currencySettingsDefaults(crypto);
  return {
    confirmationsNb: defaults.confirmationsNb ? defaults.confirmationsNb.def : 0,
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

export const storeSelector = (state: State): SettingsState => state.settings;
export const settingsExportSelector = storeSelector;
export const discreetModeSelector = (state: State): boolean => state.settings.discreetMode === true;
export const getCounterValueCode = (state: State) => state.settings.counterValue;
export const lastSeenCustomImageSelector = (state: State) => state.settings.lastSeenCustomImage;
export const deepLinkUrlSelector = (state: State) => state.settings.deepLinkUrl;
export const counterValueCurrencyLocalSelector = (state: SettingsState): Currency =>
  findCurrencyByTicker(state.counterValue) || getFiatCurrencyByTicker("USD");
export const counterValueCurrencySelector = createSelector(
  storeSelector,
  counterValueCurrencyLocalSelector,
);
export const countervalueFirstSelector = createSelector(storeSelector, s => s.countervalueFirst);
export const developerModeSelector = (state: State): boolean => state.settings.developerMode;
export const lastUsedVersionSelector = (state: State): string => state.settings.lastUsedVersion;
export const userThemeSelector = (state: State): "dark" | "light" | undefined | null => {
  const savedVal = state.settings.theme;
  return ["dark", "light"].includes(savedVal as string) ? (savedVal as "dark" | "light") : "dark";
};

type LanguageAndUseSystemLanguage = {
  language: Language;
  useSystemLanguage: boolean;
};

const languageAndUseSystemLangSelector = (state: State): LanguageAndUseSystemLanguage => {
  const { language } = state.settings;
  if (language && LanguageIds.includes(language)) {
    return {
      language,
      useSystemLanguage: false,
    };
  } else {
    return {
      language: getInitialLanguageAndLocale().language,
      useSystemLanguage: true,
    };
  }
};

/** Use this for translations */
export const languageSelector = createSelector(languageAndUseSystemLangSelector, o => o.language);
export const useSystemLanguageSelector = createSelector(
  languageAndUseSystemLangSelector,
  o => o.useSystemLanguage,
);
const isValidRegionLocale = (locale: string) => {
  return regionsByKey.hasOwnProperty(locale);
};
const localeFallbackToLanguageSelector = (
  state: State,
): {
  locale: string;
} => {
  const { language, locale, region } = state.settings;
  if (!locale && language) {
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
  } else if (locale && isValidRegionLocale(locale))
    return {
      locale,
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
  const currencySettings = settings.currenciesSettings[currency.ticker];
  const val = {
    ...defaultsForCurrency(currency),
    ...currencySettings,
  };
  return val;
};

export const currencyPropExtractor = (_: State, { currency }: { currency: CryptoCurrency }) =>
  currency;

// TODO: drop (bad perf implication)
export const currencySettingsSelector = createSelector(
  storeSelector,
  currencyPropExtractor,
  currencySettingsLocaleSelector,
);
export const exchangeSettingsForPairSelector = (
  state: State,
  {
    from,
    to,
  }: {
    from: Currency;
    to: Currency;
  },
): string | undefined | null => state.settings.pairExchanges[pairHash(from, to)];
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
export const preferredDeviceModelSelector = (state: State) => state.settings.preferredDeviceModel;
export const sidebarCollapsedSelector = (state: State) => state.settings.sidebarCollapsed;
export const accountsViewModeSelector = (state: State) => state.settings.accountsViewMode;
export const nftsViewModeSelector = (state: State) => state.settings.nftsViewMode;
export const sentryLogsSelector = (state: State) => state.settings.sentryLogs;
export const autoLockTimeoutSelector = (state: State) => state.settings.autoLockTimeout;
export const shareAnalyticsSelector = (state: State) => state.settings.shareAnalytics;
export const selectedTimeRangeSelector = (state: State) => state.settings.selectedTimeRange;
export const hasInstalledAppsSelector = (state: State) => state.settings.hasInstalledApps;
export const USBTroubleshootingIndexSelector = (state: State) =>
  state.settings.USBTroubleshootingIndex;
export const allowDebugAppsSelector = (state: State) => state.settings.allowDebugApps;
export const allowExperimentalAppsSelector = (state: State) => state.settings.allowExperimentalApps;
export const enablePlatformDevToolsSelector = (state: State) =>
  state.settings.enablePlatformDevTools;
export const catalogProviderSelector = (state: State) => state.settings.catalogProvider;
export const enableLearnPageStagingUrlSelector = (state: State) =>
  state.settings.enableLearnPageStagingUrl;
export const blacklistedTokenIdsSelector = (state: State) => state.settings.blacklistedTokenIds;
export const hiddenNftCollectionsSelector = (state: State) => state.settings.hiddenNftCollections;
export const hasCompletedOnboardingSelector = (state: State) =>
  state.settings.hasCompletedOnboarding;
export const dismissedBannersSelector = (state: State) => state.settings.dismissedBanners || [];
export const dismissedBannerSelector = (
  state: State,
  {
    bannerKey,
  }: {
    bannerKey: string;
  },
) => (state.settings.dismissedBanners || []).includes(bannerKey);
export const dismissedBannerSelectorLoaded = (bannerKey: string) => (state: State) =>
  (state.settings.dismissedBanners || []).includes(bannerKey);
export const hideEmptyTokenAccountsSelector = (state: State) =>
  state.settings.hideEmptyTokenAccounts;
export const filterTokenOperationsZeroAmountSelector = (state: State) =>
  state.settings.filterTokenOperationsZeroAmount;
export const lastSeenDeviceSelector = (state: State): DeviceModelInfo | null | undefined => {
  // Nb workaround to prevent crash for dev/qa that have nanoFTS references.
  // to be removed in a while.
  // @ts-expect-error TODO: time to remove this maybe?
  if (state.settings.lastSeenDevice?.modelId === "nanoFTS") {
    return {
      ...state.settings.lastSeenDevice,
      modelId: DeviceModelId.stax,
    };
  }
  return state.settings.lastSeenDevice;
};
export const devicesModelListSelector = (state: State): DeviceModelId[] =>
  state.settings.devicesModelList;
export const latestFirmwareSelector = (state: State) => state.settings.latestFirmware;
export const swapHasAcceptedIPSharingSelector = (state: State) =>
  state.settings.swap.hasAcceptedIPSharing;
export const swapSelectableCurrenciesSelector = (state: State) =>
  state.settings.swap.selectableCurrencies;
export const swapAcceptedProvidersSelector = (state: State) =>
  state.settings.swap.acceptedProviders;
export const showClearCacheBannerSelector = (state: State) => state.settings.showClearCacheBanner;
export const exportSettingsSelector = createSelector(
  counterValueCurrencySelector,
  (state: State) => state.settings.currenciesSettings,
  (state: State) => state.settings.pairExchanges,
  developerModeSelector,
  blacklistedTokenIdsSelector,
  (
    counterValueCurrency,
    currenciesSettings,
    pairExchanges,
    developerModeEnabled,
    blacklistedTokenIds,
  ) => ({
    counterValue: counterValueCurrency.ticker,
    currenciesSettings,
    pairExchanges,
    developerModeEnabled,
    blacklistedTokenIds,
  }),
);
export const starredMarketCoinsSelector = (state: State) => state.settings.starredMarketCoins;
export const overriddenFeatureFlagsSelector = (state: State) =>
  state.settings.overriddenFeatureFlags;
export const featureFlagsButtonVisibleSelector = (state: State) =>
  state.settings.featureFlagsButtonVisible;
export const vaultSignerSelector = (state: State) => state.settings.vaultSigner;
export const supportedCounterValuesSelector = (state: State) =>
  state.settings.supportedCounterValues;
