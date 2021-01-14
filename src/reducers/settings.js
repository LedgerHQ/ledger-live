// @flow
/* eslint import/no-cycle: 0 */
import { handleActions } from "redux-actions";
import { Platform, Appearance } from "react-native";
import merge from "lodash/merge";
import {
  findCurrencyByTicker,
  getCryptoCurrencyById,
  getFiatCurrencyByTicker,
  listSupportedFiats,
  isCurrencySupported,
  findCryptoCurrencyById,
  findTokenById,
} from "@ledgerhq/live-common/lib/currencies";
import { getEnv, setEnvUnsafe } from "@ledgerhq/live-common/lib/env";
import { createSelector } from "reselect";
import type {
  CryptoCurrency,
  Currency,
  AccountLike,
  TokenCurrency,
} from "@ledgerhq/live-common/lib/types";
import { getAccountCurrency } from "@ledgerhq/live-common/lib/account/helpers";
import Config from "react-native-config";
import type { AvailableProvider } from "@ledgerhq/live-common/lib/exchange/swap/types";
import type { OutputSelector } from "reselect";
import uniq from "lodash/uniq";

import { isCurrencyExchangeSupported } from "@ledgerhq/live-common/lib/exchange";
import { currencySettingsDefaults } from "../helpers/CurrencySettingsDefaults";
import type { State } from ".";

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
  week: 7,
  month: 30,
  year: 365,
};

export type TimeRange = $Keys<typeof timeRangeDaysByKey>;

export type Privacy = {
  // when we set the privacy, we also retrieve the biometricsType info
  biometricsType: ?string,
  // this tells if the biometrics was enabled by user yet
  biometricsEnabled: boolean,
};

const colorScheme = Appearance.getColorScheme();

export type Theme = "light" | "dark" | "dusk";

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
  selectedTimeRange: TimeRange,
  orderAccounts: string,
  hasCompletedOnboarding: boolean,
  hasInstalledAnyApp: boolean,
  readOnlyModeEnabled: boolean,
  experimentalUSBEnabled: boolean,
  countervalueFirst: boolean,
  hideEmptyTokenAccounts: boolean,
  blacklistedTokenIds: string[],
  dismissedBanners: string[],
  hasAvailableUpdate: boolean,
  hasAcceptedSwapKYC: boolean,
  swapProviders?: AvailableProvider[],
  theme: Theme,
  carouselVisibility: number,
  discreetMode: boolean,
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
  countervalueFirst: false,
  hideEmptyTokenAccounts: false,
  blacklistedTokenIds: [],
  dismissedBanners: [],
  hasAvailableUpdate: false,
  hasAcceptedSwapKYC: false,
  swapProviders: [],
  theme: colorScheme === "dark" ? "dusk" : "light",
  carouselVisibility: 0,
  discreetMode: false,
};

const pairHash = (from, to) => `${from.ticker}_${to.ticker}`;

const handlers: Object = {
  SETTINGS_IMPORT: (state: SettingsState, { settings }) => ({
    ...state,
    ...settings,
  }),
  SETTINGS_IMPORT_DESKTOP: (state: SettingsState, { settings }) => {
    const { developerModeEnabled, ...rest } = settings;

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

  SETTINGS_SET_HAS_ACCEPTED_SWAP_KYC: (
    state: SettingsState,
    { hasAcceptedSwapKYC },
  ) => ({
    ...state,
    hasAcceptedSwapKYC,
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
    countervalueFirst: !state.countervalueFirst,
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
  SETTINGS_SET_SWAP_PROVIDERS: (state, { swapProviders }) => ({
    ...state,
    swapProviders,
  }),
  SETTINGS_SET_THEME: (state, { payload: theme }) => ({
    ...state,
    theme,
  }),
  SETTINGS_SET_CAROUSEL_VISIBILITY: (state: AppState, { payload }) => ({
    ...state,
    carouselVisibility: payload,
  }),
  SETTINGS_SET_DISCREET_MODE: (state: AppState, { payload }) => ({
    ...state,
    discreetMode: payload,
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

export const hasAcceptedSwapKYCSelector = (state: State) =>
  state.settings.hasAcceptedSwapKYC;

export const hasInstalledAnyAppSelector = (state: State) =>
  state.settings.hasInstalledAnyApp;

export const countervalueFirstSelector = (state: State) =>
  state.settings.countervalueFirst;

export const readOnlyModeEnabledSelector = (state: State) =>
  Platform.OS !== "android" && state.settings.readOnlyModeEnabled;

export const blacklistedTokenIdsSelector = (state: State) =>
  state.settings.blacklistedTokenIds;

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

export const swapProvidersSelector = (state: State) =>
  state.settings.swapProviders;

export const carouselVisibilitySelector = (state: State) =>
  state.settings.carouselVisibility;

export const swapSupportedCurrenciesSelector: OutputSelector<
  State,
  { accountId: string },
  (TokenCurrency | CryptoCurrency)[],
> = createSelector(swapProvidersSelector, swapProviders => {
  if (!swapProviders) return [];

  const allIds = uniq(
    swapProviders.reduce(
      (ac, { supportedCurrencies }) => [...ac, ...supportedCurrencies],
      [],
    ),
  );

  const tokenCurrencies = allIds
    .map(findTokenById)
    .filter(Boolean)
    .filter(t => !t.delisted);
  const cryptoCurrencies = allIds
    .map(findCryptoCurrencyById)
    .filter(Boolean)
    .filter(isCurrencySupported);

  return [...cryptoCurrencies, ...tokenCurrencies].filter(
    isCurrencyExchangeSupported,
  );
});

export const discreetModeSelector = (state: State): boolean =>
  state.settings.discreetMode === true;

export default handleActions(handlers, INITIAL_STATE);

export const themeSelector = (state: State) => state.settings.theme;
