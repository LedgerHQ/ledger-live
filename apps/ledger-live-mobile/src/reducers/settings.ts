import { handleActions } from "redux-actions";
import merge from "lodash/merge";
import {
  findCurrencyByTicker,
  getCryptoCurrencyById,
  getFiatCurrencyByTicker,
  listSupportedFiats,
} from "@ledgerhq/live-common/currencies/index";
import { getEnv, setEnvUnsafe } from "@ledgerhq/live-common/env";
import { createSelector } from "reselect";
import type { CryptoCurrency, Currency } from "@ledgerhq/types-cryptoassets";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { getAccountCurrency } from "@ledgerhq/live-common/account/helpers";
import type {
  DeviceModelInfo,
  AccountLike,
  PortfolioRange,
} from "@ledgerhq/types-live";
import { KYCStatus } from "@ledgerhq/live-common/exchange/swap/types";
import { MarketListRequestParams } from "@ledgerhq/live-common/market/types";
import { currencySettingsDefaults } from "../helpers/CurrencySettingsDefaults";
import type { State } from ".";
// eslint-disable-next-line import/no-cycle
import { SLIDES } from "../components/Carousel/shared";
import { getDefaultLanguageLocale, getDefaultLocale } from "../languages";

const bitcoin = getCryptoCurrencyById("bitcoin");
const ethereum = getCryptoCurrencyById("ethereum");
export const possibleIntermediaries = [bitcoin, ethereum];
export const supportedCountervalues = [
  ...listSupportedFiats(),
  ...possibleIntermediaries,
];
export const intermediaryCurrency = (from: Currency, _to: Currency) => {
  if (from === ethereum || from.type === "TokenCurrency") return ethereum;
  return bitcoin;
};
export type CurrencySettings = {
  confirmationsNb: number;
};
export const timeRangeDaysByKey = {
  day: 1,
  week: 7,
  month: 30,
  year: 365,
  all: -1,
};
export type Privacy = {
  // when we set the privacy, we also retrieve the biometricsType info
  biometricsType: string | null | undefined;
  // this tells if the biometrics was enabled by user yet
  biometricsEnabled: boolean;
};
export type Theme = "system" | "light" | "dark";
export type SettingsState = {
  counterValue: string;
  counterValueExchange: string | null | undefined;
  reportErrorsEnabled: boolean;
  analyticsEnabled: boolean;
  privacy: Privacy | null | undefined;
  currenciesSettings: Record<string, CurrencySettings>;
  pairExchanges: Record<string, string | null | undefined>;
  selectedTimeRange: PortfolioRange;
  orderAccounts: string;
  hasCompletedOnboarding: boolean;
  hasInstalledAnyApp: boolean;
  readOnlyModeEnabled: boolean;
  hasOrderedNano: boolean;
  experimentalUSBEnabled: boolean;
  countervalueFirst: boolean;
  graphCountervalueFirst: boolean;
  hideEmptyTokenAccounts: boolean;
  blacklistedTokenIds: string[];
  hiddenNftCollections: string[];
  dismissedBanners: string[];
  hasAvailableUpdate: boolean;
  theme: Theme;
  osTheme: string | null | undefined;
  carouselVisibility: number | Record<string, boolean>;
  // number is the legacy type from LLM V2
  discreetMode: boolean;
  language: string;
  languageIsSetByUser: boolean;
  locale: string | null | undefined;
  swap: {
    hasAcceptedIPSharing: false;
    acceptedProviders: string[];
    selectableCurrencies: string[];
    KYC: {
      [key: string]: KYCStatus;
    };
  };
  lastSeenDevice: DeviceModelInfo | null | undefined;
  starredMarketCoins: string[];
  lastConnectedDevice: Device | null | undefined;
  marketRequestParams: MarketListRequestParams;
  marketCounterCurrency: string | null | undefined;
  marketFilterByStarredAccounts: boolean;
  sensitiveAnalytics: boolean;
  firstConnectionHasDevice: boolean | null;
  notifications: {
    allowed: boolean;
    transactions: boolean;
    market: boolean;
    announcement: boolean;
    price: boolean;
  };
};
export const INITIAL_STATE: SettingsState = {
  counterValue: "USD",
  counterValueExchange: null,
  privacy: null,
  reportErrorsEnabled: true,
  analyticsEnabled: true,
  currenciesSettings: {},
  pairExchanges: {},
  selectedTimeRange: "month",
  orderAccounts: "balance|desc",
  hasCompletedOnboarding: false,
  hasInstalledAnyApp: true,
  // readOnlyModeEnabled: !Config.DISABLE_READ_ONLY,
  readOnlyModeEnabled: true,
  hasOrderedNano: false,
  experimentalUSBEnabled: false,
  countervalueFirst: true,
  graphCountervalueFirst: true,
  hideEmptyTokenAccounts: false,
  blacklistedTokenIds: [],
  hiddenNftCollections: [],
  dismissedBanners: [],
  hasAvailableUpdate: false,
  theme: "system",
  osTheme: undefined,
  // $FlowFixMe
  carouselVisibility: Object.fromEntries(
    SLIDES.map(slide => [slide.name, true]),
  ),
  discreetMode: false,
  language: getDefaultLanguageLocale(),
  languageIsSetByUser: false,
  locale: null,
  swap: {
    hasAcceptedIPSharing: false,
    acceptedProviders: [],
    selectableCurrencies: [],
    KYC: {},
  },
  lastSeenDevice: null,
  starredMarketCoins: [],
  lastConnectedDevice: null,
  marketRequestParams: {
    range: "24h",
    orderBy: "market_cap",
    order: "desc",
    liveCompatible: false,
    sparkline: false,
    top100: false,
  },
  marketCounterCurrency: null,
  marketFilterByStarredAccounts: false,
  sensitiveAnalytics: false,
  firstConnectionHasDevice: null,
  notifications: {
    allowed: false,
    transactions: false,
    market: false,
    announcement: false,
    price: false,
  },
};

const pairHash = (from, to) => `${from.ticker}_${to.ticker}`;

const handlers: Record<string, any> = {
  SETTINGS_IMPORT: (state: SettingsState, { settings }) => ({
    ...state,
    ...settings,
  }),
  SETTINGS_IMPORT_DESKTOP: (state: SettingsState, { settings }) => {
    const { developerModeEnabled, ...rest } = settings;
    if (developerModeEnabled !== undefined)
      setEnvUnsafe("MANAGER_DEV_MODE", developerModeEnabled);
    return {
      ...state,
      ...rest,
      currenciesSettings: merge(
        state.currenciesSettings,
        settings.currenciesSettings,
      ),
    };
  },
  UPDATE_CURRENCY_SETTINGS: (
    { currenciesSettings, ...state }: SettingsState,
    { ticker, patch },
  ) => ({
    ...state,
    currenciesSettings: {
      ...currenciesSettings,
      [ticker]: { ...currenciesSettings[ticker], ...patch },
    },
  }),
  SETTINGS_SET_PRIVACY: (state: SettingsState, { privacy }) => ({
    ...state,
    privacy,
  }),
  SETTINGS_SET_PRIVACY_BIOMETRICS: (state: SettingsState, { enabled }) => ({
    ...state,
    privacy: { ...state.privacy, biometricsEnabled: enabled },
  }),
  SETTINGS_DISABLE_PRIVACY: (state: SettingsState) => ({
    ...state,
    privacy: null,
  }),
  SETTINGS_SET_REPORT_ERRORS: (
    state: SettingsState,
    { reportErrorsEnabled },
  ) => ({ ...state, reportErrorsEnabled }),
  SETTINGS_SET_ANALYTICS: (state: SettingsState, { analyticsEnabled }) => ({
    ...state,
    analyticsEnabled,
  }),
  SETTINGS_SET_COUNTERVALUE: (state: SettingsState, { counterValue }) => ({
    ...state,
    counterValue,
    counterValueExchange: null, // also reset the exchange
  }),
  SETTINGS_SET_ORDER_ACCOUNTS: (state: SettingsState, { orderAccounts }) => ({
    ...state,
    orderAccounts,
  }),
  SETTINGS_SET_PAIRS: (
    state: SettingsState,
    {
      pairs,
    }: {
      pairs: Array<{
        from: Currency;
        to: Currency;
        exchange: any;
      }>;
    },
  ) => {
    const copy = { ...state };
    copy.pairExchanges = { ...copy.pairExchanges };

    for (const { to, from, exchange } of pairs) {
      copy.pairExchanges[pairHash(from, to)] = exchange;
    }

    return copy;
  },
  SETTINGS_SET_SELECTED_TIME_RANGE: (
    state,
    { payload: selectedTimeRange },
  ) => ({ ...state, selectedTimeRange }),
  SETTINGS_COMPLETE_ONBOARDING: state => ({
    ...state,
    hasCompletedOnboarding: true,
  }),
  SETTINGS_INSTALL_APP_FIRST_TIME: (state, action) => ({
    ...state,
    hasInstalledAnyApp: action.hasInstalledAnyApp,
  }),
  SETTINGS_SET_READONLY_MODE: (state, action) => ({
    ...state,
    readOnlyModeEnabled: action.enabled,
  }),
  SETTINGS_SET_EXPERIMENTAL_USB_SUPPORT: (state, action) => ({
    ...state,
    experimentalUSBEnabled: action.enabled,
  }),
  SETTINGS_SWITCH_COUNTERVALUE_FIRST: state => ({
    ...state,
    graphCountervalueFirst: !state.graphCountervalueFirst,
  }),
  SETTINGS_HIDE_EMPTY_TOKEN_ACCOUNTS: (state, { hideEmptyTokenAccounts }) => ({
    ...state,
    hideEmptyTokenAccounts,
  }),
  SHOW_TOKEN: (state: SettingsState, { payload: tokenId }) => {
    const ids = state.blacklistedTokenIds;
    return { ...state, blacklistedTokenIds: ids.filter(id => id !== tokenId) };
  },
  BLACKLIST_TOKEN: (state: SettingsState, { payload: tokenId }) => {
    const ids = state.blacklistedTokenIds;
    return { ...state, blacklistedTokenIds: [...ids, tokenId] };
  },
  HIDE_NFT_COLLECTION: (state: SettingsState, { payload: collectionId }) => {
    const ids = state.hiddenNftCollections;
    return { ...state, hiddenNftCollections: [...ids, collectionId] };
  },
  UNHIDE_NFT_COLLECTION: (state: SettingsState, { payload: collectionId }) => {
    const ids = state.hiddenNftCollections;
    return {
      ...state,
      hiddenNftCollections: ids.filter(id => id !== collectionId),
    };
  },
  SETTINGS_DISMISS_BANNER: (state, { payload }) => ({
    ...state,
    dismissedBanners: [...state.dismissedBanners, payload],
  }),
  SETTINGS_SET_AVAILABLE_UPDATE: (state, action) => ({
    ...state,
    hasAvailableUpdate: action.enabled,
  }),
  DANGEROUSLY_OVERRIDE_STATE: (state: SettingsState): SettingsState => ({
    ...state,
  }),
  SETTINGS_SET_THEME: (state, { payload: theme }) => ({ ...state, theme }),
  SETTINGS_SET_OS_THEME: (state, { payload: osTheme }) => ({
    ...state,
    osTheme,
  }),
  SETTINGS_SET_CAROUSEL_VISIBILITY: (state: SettingsState, { payload }) => ({
    ...state,
    carouselVisibility: payload,
  }),
  SETTINGS_SET_DISCREET_MODE: (state: SettingsState, { payload }) => ({
    ...state,
    discreetMode: payload,
  }),
  SETTINGS_SET_LANGUAGE: (state: SettingsState, { payload }) => ({
    ...state,
    language: payload,
    languageIsSetByUser: true,
  }),
  SETTINGS_SET_LOCALE: (state: SettingsState, { payload }) => ({
    ...state,
    locale: payload,
  }),
  // TODO swap: remove
  SET_SWAP_SELECTABLE_CURRENCIES: (state: SettingsState, { payload }) => ({
    ...state,
    swap: { ...state.swap, selectableCurrencies: payload },
  }),
  SET_SWAP_KYC: (state: SettingsState, { payload }) => {
    const { provider, id, status } = payload;
    const KYC = { ...state.swap.KYC };

    // If we have an id but a "null" KYC status, this means user is logged in to provider but has not gone through KYC yet
    if (id && typeof status !== "undefined") {
      KYC[provider] = { id, status };
    } else {
      delete KYC[provider];
    }

    return { ...state, swap: { ...state.swap, KYC } };
  },
  ACCEPT_SWAP_PROVIDER: (state: SettingsState, { payload }) => ({
    ...state,
    swap: {
      ...state.swap,
      acceptedProviders: [
        ...new Set([...(state.swap?.acceptedProviders || []), payload]),
      ],
    },
  }),
  LAST_SEEN_DEVICE_INFO: (
    state: SettingsState,
    {
      payload: dmi,
    }: {
      payload: DeviceModelInfo;
    },
  ) => ({
    ...state,
    lastSeenDevice: { ...(state.lastSeenDevice || {}), ...dmi },
  }),
  LAST_SEEN_DEVICE: (
    state: SettingsState,
    { payload }: { payload: { deviceInfo: DeviceInfo } },
  ) => ({
    ...state,
    lastSeenDevice: { ...state.lastSeenDevice, deviceInfo: payload.deviceInfo },
  }),
  ADD_STARRED_MARKET_COINS: (state: SettingsState, { payload }) => ({
    ...state,
    starredMarketCoins: [...state.starredMarketCoins, payload],
  }),
  REMOVE_STARRED_MARKET_COINS: (state: SettingsState, { payload }) => ({
    ...state,
    starredMarketCoins: state.starredMarketCoins.filter(id => id !== payload),
  }),
  SET_LAST_CONNECTED_DEVICE: (
    state: SettingsState,
    {
      payload: lastConnectedDevice,
    }: {
      payload: Device;
    },
  ) => ({ ...state, lastConnectedDevice }),
  SET_HAS_ORDERED_NANO: (state, action) => ({
    ...state,
    hasOrderedNano: action.enabled,
  }),
  SET_MARKET_REQUEST_PARAMS: (state: SettingsState, { payload }) => ({
    ...state,
    marketRequestParams: { ...state.marketRequestParams, ...payload },
  }),
  SET_MARKET_COUNTER_CURRENCY: (state: SettingsState, { payload }) => ({
    ...state,
    marketCounterCurrency: payload,
  }),
  SET_MARKET_FILTER_BY_STARRED_ACCOUNTS: (
    state: SettingsState,
    { payload },
  ) => ({
    ...state,
    marketFilterByStarredAccounts: payload,
  }),
  RESET_SWAP_LOGIN_AND_KYC_DATA: (state: SettingsState) => ({
    ...state,
    swap: {
      ...state.swap,
      KYC: {},
    },
  }),
  SET_SENSITIVE_ANALYTICS: (state: SettingsState, action) => ({
    ...state,
    sensitiveAnalytics: action.enabled,
  }),
  SET_FIRST_CONNECTION_HAS_DEVICE: (
    state: SettingsState,
    { payload }: { payload?: boolean },
  ) => ({
    ...state,
    firstConnectionHasDevice: payload,
  }),
  SET_NOTIFICATIONS: (state: SettingsState, { payload }) => ({
    ...state,
    notifications: { ...state.notifications, ...payload },
  }),
};

const storeSelector = (state: any): SettingsState => state.settings;

export const exportSelector = storeSelector;

const counterValueCurrencyLocalSelector = (state: SettingsState): Currency =>
  findCurrencyByTicker(state.counterValue) || getFiatCurrencyByTicker("USD");

export const counterValueCurrencySelector = createSelector(
  storeSelector,
  counterValueCurrencyLocalSelector,
);

const counterValueExchangeLocalSelector = (s: SettingsState) =>
  s.counterValueExchange;

export const counterValueExchangeSelector = createSelector(
  storeSelector,
  counterValueExchangeLocalSelector,
);

const defaultCurrencySettingsForCurrency: (
  _: Currency,
) => CurrencySettings = crypto => {
  const defaults = currencySettingsDefaults(crypto);
  return {
    confirmationsNb: defaults.confirmationsNb
      ? defaults.confirmationsNb.def
      : 0,
    exchange: null,
  };
};

// DEPRECATED
export const currencySettingsSelector = (
  state: State,
  {
    currency,
  }: {
    currency: Currency;
  },
) => ({
  ...defaultCurrencySettingsForCurrency(currency),
  ...state.settings.currenciesSettings[currency.ticker],
});
export const privacySelector = createSelector(storeSelector, s => s.privacy);
export const reportErrorsEnabledSelector = createSelector(
  storeSelector,
  s => s.reportErrorsEnabled,
);
export const analyticsEnabledSelector = createSelector(
  storeSelector,
  s => s.analyticsEnabled,
);
export const experimentalUSBEnabledSelector = createSelector(
  storeSelector,
  s => s.experimentalUSBEnabled,
);
export const currencySettingsForAccountSelector = (
  s: any,
  {
    account,
  }: {
    account: AccountLike;
  },
) =>
  currencySettingsSelector(s, {
    currency: getAccountCurrency(account),
  });
export const exchangeSettingsForPairSelector = (
  state: State,
  {
    from,
    to,
  }: {
    from: Currency;
    to: Currency;
  },
): string | null | undefined =>
  state.settings.pairExchanges[pairHash(from, to)];
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
export const selectedTimeRangeSelector = (state: State) =>
  state.settings.selectedTimeRange;
export const orderAccountsSelector = (state: State) =>
  state.settings.orderAccounts;
export const hasCompletedOnboardingSelector = (state: State) =>
  state.settings.hasCompletedOnboarding;
export const hasInstalledAnyAppSelector = (state: State) =>
  state.settings.hasInstalledAnyApp;
export const countervalueFirstSelector = (state: State) =>
  state.settings.graphCountervalueFirst;
export const readOnlyModeEnabledSelector = (state: State) =>
  state.settings.readOnlyModeEnabled;
export const blacklistedTokenIdsSelector = (state: State) =>
  state.settings.blacklistedTokenIds;
export const hiddenNftCollectionsSelector = (state: State) =>
  state.settings.hiddenNftCollections;
export const exportSettingsSelector = createSelector(
  counterValueCurrencySelector,
  () => getEnv("MANAGER_DEV_MODE"),
  state => state.settings.currenciesSettings,
  state => state.settings.pairExchanges,
  (
    counterValueCurrency,
    developerModeEnabled,
    currenciesSettings,
    pairExchanges,
  ) => ({
    counterValue: counterValueCurrency.ticker,
    currenciesSettings,
    pairExchanges,
    developerModeEnabled,
  }),
);
export const hideEmptyTokenAccountsEnabledSelector = (state: State) =>
  state.settings.hideEmptyTokenAccounts;
export const dismissedBannersSelector = (state: State) =>
  state.settings.dismissedBanners;
export const hasAvailableUpdateSelector = (state: State) =>
  state.settings.hasAvailableUpdate;
export const carouselVisibilitySelector = (state: State) => {
  const settingValue = state.settings.carouselVisibility;

  if (typeof settingValue === "number") {
    /**
     * Ensure correct behavior when using the legacy setting value from LLM v2:
     * We show all the slides as they are different from the ones in V2.
     * Users will then be able to hide them one by one if they want.
     */
    // $FlowFixMe
    return Object.fromEntries(SLIDES.map(slide => [slide.name, true]));
  }

  return settingValue;
};
export const discreetModeSelector = (state: State): boolean =>
  state.settings.discreetMode === true;
export default handleActions(handlers, INITIAL_STATE);
export const themeSelector = (state: State) => {
  const val = state.settings.theme;
  return val === "dusk" ? "dark" : val;
};
export const osThemeSelector = (state: State) => state.settings.osTheme;
export const languageSelector = (state: State) =>
  state.settings.language || getDefaultLanguageLocale();
export const languageIsSetByUserSelector = (state: State) =>
  state.settings.languageIsSetByUser;
export const localeSelector = (state: State) =>
  state.settings.locale || getDefaultLocale();
export const swapHasAcceptedIPSharingSelector = (state: State) =>
  state.settings.swap.hasAcceptedIPSharing;
export const swapSelectableCurrenciesSelector = (state: Record<string, any>) =>
  state.settings.swap.selectableCurrencies;
export const swapAcceptedProvidersSelector = (state: State) =>
  state.settings.swap.acceptedProviders;
export const swapKYCSelector = (state: State) => state.settings.swap.KYC;

export const lastSeenDeviceSelector = (state: State) =>
  state.settings.lastSeenDevice;
export const starredMarketCoinsSelector = (state: State) =>
  state.settings.starredMarketCoins;
export const lastConnectedDeviceSelector = (state: State) =>
  state.settings.lastConnectedDevice;
export const hasOrderedNanoSelector = (state: State) =>
  state.settings.hasOrderedNano;
export const marketRequestParamsSelector = (state: State) =>
  state.settings.marketRequestParams;
export const marketCounterCurrencySelector = (state: State) =>
  state.settings.marketCounterCurrency;
export const marketFilterByStarredAccountsSelector = (state: State) =>
  state.settings.marketFilterByStarredAccounts;
export const sensitiveAnalyticsSelector = (state: State) =>
  state.settings.sensitiveAnalytics;
export const firstConnectionHasDeviceSelector = (state: State) =>
  state.settings.firstConnectionHasDevice;
export const notificationsSelector = (state: State) =>
  state.settings.notifications;
