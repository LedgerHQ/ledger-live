// @flow
/* eslint import/no-cycle: 0 */
import { handleActions } from "redux-actions";
import merge from "lodash/merge";
import {
  findCurrencyByTicker,
  getCryptoCurrencyById,
  getFiatCurrencyByTicker,
  listSupportedFiats,
} from "@ledgerhq/live-common/lib/currencies";
import { getEnv, setEnvUnsafe } from "@ledgerhq/live-common/lib/env";
import { createSelector } from "reselect";
import type {
  CryptoCurrency,
  Currency,
  AccountLike,
} from "@ledgerhq/live-common/lib/types";
import type { Device } from "@ledgerhq/live-common/lib/hw/actions/types";
import { getAccountCurrency } from "@ledgerhq/live-common/lib/account/helpers";
import Config from "react-native-config";
import type { PortfolioRange } from "@ledgerhq/live-common/lib/portfolio/v2/types";
import type { DeviceModelInfo } from "@ledgerhq/live-common/lib/types/manager";
import { MarketListRequestParams } from "@ledgerhq/live-common/lib/market/types";
import { currencySettingsDefaults } from "../helpers/CurrencySettingsDefaults";
import type { State } from ".";
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
  confirmationsNb: number,
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
  biometricsType: ?string,
  // this tells if the biometrics was enabled by user yet
  biometricsEnabled: boolean,
};

export type Theme = "system" | "light" | "dark";

export type SettingsState = {
  counterValue: string,
  counterValueExchange: ?string,
  reportErrorsEnabled: boolean,
  analyticsEnabled: boolean,
  privacy: ?Privacy,
  currenciesSettings: {
    [ticker: string]: CurrencySettings,
  },
  pairExchanges: {
    [pair: string]: ?string,
  },
  selectedTimeRange: PortfolioRange,
  orderAccounts: string,
  hasCompletedOnboarding: boolean,
  hasInstalledAnyApp: boolean,
  readOnlyModeEnabled: boolean,
  experimentalUSBEnabled: boolean,
  countervalueFirst: boolean,
  graphCountervalueFirst: boolean,
  hideEmptyTokenAccounts: boolean,
  blacklistedTokenIds: string[],
  hiddenNftCollections: string[],
  dismissedBanners: string[],
  hasAvailableUpdate: boolean,
  theme: Theme,
  osTheme: ?string,
  carouselVisibility: number | { [slideName: string]: boolean }, // number is the legacy type from LLM V2
  discreetMode: boolean,
  language: string,
  languageIsSetByUser: boolean,
  locale: ?string,
  swap: {
    hasAcceptedIPSharing: false,
    acceptedProviders: [],
    selectableCurrencies: [],
    KYC: {},
  },
  lastSeenDevice: ?DeviceModelInfo,
  starredMarketCoins: string[],
  lastConnectedDevice: ?Device,
  marketRequestParams: MarketListRequestParams,
  marketCounterCurrency: ?string,
  marketFilterByStarredAccounts: boolean,
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
  readOnlyModeEnabled: !Config.DISABLE_READ_ONLY,
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
};

const pairHash = (from, to) => `${from.ticker}_${to.ticker}`;

const handlers: Object = {
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
    privacy: {
      ...state.privacy,
      biometricsEnabled: enabled,
    },
  }),

  SETTINGS_DISABLE_PRIVACY: (state: SettingsState) => ({
    ...state,
    privacy: null,
  }),

  SETTINGS_SET_REPORT_ERRORS: (
    state: SettingsState,
    { reportErrorsEnabled },
  ) => ({
    ...state,
    reportErrorsEnabled,
  }),

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
        from: Currency,
        to: Currency,
        exchange: *,
      }>,
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
  ) => ({
    ...state,
    selectedTimeRange,
  }),

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
    return {
      ...state,
      blacklistedTokenIds: ids.filter(id => id !== tokenId),
    };
  },
  BLACKLIST_TOKEN: (state: SettingsState, { payload: tokenId }) => {
    const ids = state.blacklistedTokenIds;
    return {
      ...state,
      blacklistedTokenIds: [...ids, tokenId],
    };
  },
  HIDE_NFT_COLLECTION: (state: SettingsState, { payload: collectionId }) => {
    const ids = state.hiddenNftCollections;
    return {
      ...state,
      hiddenNftCollections: [...ids, collectionId],
    };
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
  SETTINGS_SET_THEME: (state, { payload: theme }) => ({
    ...state,
    theme,
  }),
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
  SET_SWAP_SELECTABLE_CURRENCIES: (state: SettingsState, { payload }) => ({
    ...state,
    swap: {
      ...state.swap,
      selectableCurrencies: payload,
    },
  }),
  SET_SWAP_KYC: (state: SettingsState, { payload }) => {
    const { provider, id, status } = payload;
    const KYC = { ...state.swap.KYC };

    if (id && status) {
      KYC[provider] = { id, status };
    } else {
      delete KYC[provider];
    }

    return {
      ...state,
      swap: {
        ...state.swap,
        KYC,
      },
    };
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
    { payload: dmi }: { payload: DeviceModelInfo },
  ) => ({
    ...state,
    lastSeenDevice: {
      ...(state.lastSeenDevice || {}),
      ...dmi,
    },
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
    { payload: lastConnectedDevice }: { payload: Device },
  ) => ({
    ...state,
    lastConnectedDevice,
  }),
  SET_MARKET_REQUEST_PARAMS: (state: SettingsState, { payload }) => ({
    ...state,
    marketRequestParams: {
      ...state.marketRequestParams,
      ...payload,
    },
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
};

const storeSelector = (state: *): SettingsState => state.settings;

export const exportSelector = storeSelector;

const counterValueCurrencyLocalSelector = (state: SettingsState): Currency =>
  findCurrencyByTicker(state.counterValue) || getFiatCurrencyByTicker("USD");

// $FlowFixMe
export const counterValueCurrencySelector = createSelector(
  storeSelector,
  counterValueCurrencyLocalSelector,
);

const counterValueExchangeLocalSelector = (s: SettingsState) =>
  s.counterValueExchange;

// $FlowFixMe
export const counterValueExchangeSelector = createSelector(
  storeSelector,
  counterValueExchangeLocalSelector,
);

const defaultCurrencySettingsForCurrency: Currency => CurrencySettings = crypto => {
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
  { currency }: { currency: Currency },
) => ({
  ...defaultCurrencySettingsForCurrency(currency),
  ...state.settings.currenciesSettings[currency.ticker],
});

// $FlowFixMe
export const privacySelector = createSelector(storeSelector, s => s.privacy);

// $FlowFixMe
export const reportErrorsEnabledSelector = createSelector(
  storeSelector,
  s => s.reportErrorsEnabled,
);

// $FlowFixMe
export const analyticsEnabledSelector = createSelector(
  storeSelector,
  s => s.analyticsEnabled,
);

// $FlowFixMe
export const experimentalUSBEnabledSelector = createSelector(
  storeSelector,
  s => s.experimentalUSBEnabled,
);

export const currencySettingsForAccountSelector = (
  s: *,
  { account }: { account: AccountLike },
) => currencySettingsSelector(s, { currency: getAccountCurrency(account) });

export const exchangeSettingsForPairSelector = (
  state: State,
  { from, to }: { from: Currency, to: Currency },
): ?string => state.settings.pairExchanges[pairHash(from, to)];

export const confirmationsNbForCurrencySelector = (
  state: State,
  { currency }: { currency: CryptoCurrency },
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

// $FlowFixMe
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

export const swapSelectableCurrenciesSelector = (state: Object) =>
  state.settings.swap.selectableCurrencies;

export const swapAcceptedProvidersSelector = (state: State) =>
  state.settings.swap.acceptedProviders;

export const swapKYCSelector = (state: Object) => state.settings.swap.KYC;

export const lastSeenDeviceSelector = (state: State) =>
  state.settings.lastSeenDevice;

export const starredMarketCoinsSelector = (state: State) =>
  state.settings.starredMarketCoins;

export const lastConnectedDeviceSelector = (state: State) =>
  state.settings.lastConnectedDevice;

export const marketRequestParamsSelector = (state: State) =>
  state.settings.marketRequestParams;

export const marketCounterCurrencySelector = (state: State) =>
  state.settings.marketCounterCurrency;

export const marketFilterByStarredAccountsSelector = (state: State) =>
  state.settings.marketFilterByStarredAccounts;
