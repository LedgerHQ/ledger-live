import { handleActions } from "redux-actions";
import type { Action } from "redux-actions";
import merge from "lodash/merge";
import {
  findCurrencyByTicker,
  getCryptoCurrencyById,
  getFiatCurrencyByTicker,
  listSupportedFiats,
} from "@ledgerhq/live-common/currencies/index";
import { getEnv, setEnvUnsafe } from "@ledgerhq/live-common/env";
import { createSelector } from "reselect";
import { getAccountCurrency } from "@ledgerhq/live-common/account/helpers";
import type { CryptoCurrency, Currency } from "@ledgerhq/types-cryptoassets";
import type { AccountLike } from "@ledgerhq/types-live";
import type { CurrencySettings, SettingsState, State } from "./types";
import { currencySettingsDefaults } from "../helpers/CurrencySettingsDefaults";
// eslint-disable-next-line import/no-cycle
import { SLIDES } from "../components/Carousel/shared";
import { getDefaultLanguageLocale, getDefaultLocale } from "../languages";
import type {
  SettingsAcceptSwapProviderPayload,
  SettingsAddStarredMarketcoinsPayload,
  SettingsBlacklistTokenPayload,
  SettingsDismissBannerPayload,
  SettingsSetSwapKycPayload,
  SettingsHideEmptyTokenAccountsPayload,
  SettingsHideNftCollectionPayload,
  SettingsImportDesktopPayload,
  SettingsImportPayload,
  SettingsInstallAppFirstTimePayload,
  SettingsLastSeenDeviceInfoPayload,
  SettingsPayload,
  SettingsRemoveStarredMarketcoinsPayload,
  SettingsSetAnalyticsPayload,
  SettingsSetAvailableUpdatePayload,
  SettingsSetCarouselVisibilityPayload,
  SettingsSetCountervaluePayload,
  SettingsSetDiscreetModePayload,
  SettingsSetExperimentalUsbSupportPayload,
  SettingsSetFirstConnectionHasDevicePayload,
  SettingsSetHasOrderedNanoPayload,
  SettingsSetLanguagePayload,
  SettingsSetLastConnectedDevicePayload,
  SettingsSetLocalePayload,
  SettingsSetMarketCounterCurrencyPayload,
  SettingsSetMarketFilterByStarredAccountsPayload,
  SettingsSetMarketRequestParamsPayload,
  SettingsSetNotificationsPayload,
  SettingsSetOrderAccountsPayload,
  SettingsSetOsThemePayload,
  SettingsSetPairsPayload,
  SettingsSetPrivacyBiometricsPayload,
  SettingsSetPrivacyPayload,
  SettingsSetReadOnlyModePayload,
  SettingsSetReportErrorsPayload,
  SettingsSetSelectedTimeRangePayload,
  SettingsSetSensitiveAnalyticsPayload,
  SettingsSetThemePayload,
  SettingsShowTokenPayload,
  SettingsUnhideNftCollectionPayload,
  SettingsUpdateCurrencyPayload,
  SettingsSetSwapSelectableCurrenciesPayload,
} from "../actions/types";
import { SettingsActionTypes } from "../actions/types";

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
export const timeRangeDaysByKey = {
  day: 1,
  week: 7,
  month: 30,
  year: 365,
  all: -1,
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

const pairHash = (from: { ticker: string }, to: { ticker: string }) =>
  `${from.ticker}_${to.ticker}`;

const handlers = {
  [SettingsActionTypes.SETTINGS_IMPORT]: (
    state: SettingsState,
    { payload }: Action<SettingsImportPayload>,
  ) => ({
    ...state,
    ...payload,
  }),

  [SettingsActionTypes.SETTINGS_IMPORT_DESKTOP]: (
    state: SettingsState,
    { payload }: Action<SettingsImportDesktopPayload>,
  ) => {
    const { developerModeEnabled, ...rest } = payload;
    if (developerModeEnabled !== undefined)
      setEnvUnsafe("MANAGER_DEV_MODE", developerModeEnabled);
    return {
      ...state,
      ...rest,
      currenciesSettings: merge(
        state.currenciesSettings,
        payload.currenciesSettings,
      ),
    };
  },

  [SettingsActionTypes.UPDATE_CURRENCY_SETTINGS]: (
    { currenciesSettings, ...state }: SettingsState,
    { payload: { ticker, patch } }: Action<SettingsUpdateCurrencyPayload>,
  ) => ({
    ...state,
    currenciesSettings: {
      ...currenciesSettings,
      [ticker]: { ...currenciesSettings[ticker], ...patch },
    },
  }),

  [SettingsActionTypes.SETTINGS_SET_PRIVACY]: (
    state: SettingsState,
    { payload: { privacy } }: Action<SettingsSetPrivacyPayload>,
  ) => ({
    ...state,
    privacy: {
      ...state.privacy,
      ...privacy,
    },
  }),

  [SettingsActionTypes.SETTINGS_SET_PRIVACY_BIOMETRICS]: (
    state: SettingsState,
    {
      payload: { biometricsEnabled },
    }: Action<SettingsSetPrivacyBiometricsPayload>,
  ) => ({
    ...state,
    privacy: { ...state.privacy, biometricsEnabled },
  }),

  [SettingsActionTypes.SETTINGS_DISABLE_PRIVACY]: (state: SettingsState) => ({
    ...state,
    privacy: null,
  }),

  [SettingsActionTypes.SETTINGS_SET_REPORT_ERRORS]: (
    state: SettingsState,
    {
      payload: { reportErrorsEnabled },
    }: Action<SettingsSetReportErrorsPayload>,
  ) => ({ ...state, reportErrorsEnabled }),

  [SettingsActionTypes.SETTINGS_SET_ANALYTICS]: (
    state: SettingsState,
    { payload: { analyticsEnabled } }: Action<SettingsSetAnalyticsPayload>,
  ) => ({
    ...state,
    analyticsEnabled,
  }),

  [SettingsActionTypes.SETTINGS_SET_COUNTERVALUE]: (
    state: SettingsState,
    { payload: { counterValue } }: Action<SettingsSetCountervaluePayload>,
  ) => ({
    ...state,
    counterValue,
    counterValueExchange: null, // also reset the exchange
  }),

  [SettingsActionTypes.SETTINGS_SET_ORDER_ACCOUNTS]: (
    state: SettingsState,
    { payload: { orderAccounts } }: Action<SettingsSetOrderAccountsPayload>,
  ) => ({
    ...state,
    orderAccounts,
  }),

  [SettingsActionTypes.SETTINGS_SET_PAIRS]: (
    state: SettingsState,
    { payload: { pairs } }: Action<SettingsSetPairsPayload>,
  ) => {
    const copy = { ...state };
    copy.pairExchanges = { ...copy.pairExchanges };

    for (const { to, from, exchange } of pairs) {
      copy.pairExchanges[pairHash(from, to)] = exchange;
    }

    return copy;
  },

  [SettingsActionTypes.SETTINGS_SET_SELECTED_TIME_RANGE]: (
    state: SettingsState,
    {
      payload: { selectedTimeRange },
    }: Action<SettingsSetSelectedTimeRangePayload>,
  ) => ({ ...state, selectedTimeRange }),

  [SettingsActionTypes.SETTINGS_COMPLETE_ONBOARDING]: (
    state: SettingsState,
  ) => ({
    ...state,
    hasCompletedOnboarding: true,
  }),

  [SettingsActionTypes.SETTINGS_INSTALL_APP_FIRST_TIME]: (
    state: SettingsState,
    {
      payload: { hasInstalledAnyApp },
    }: Action<SettingsInstallAppFirstTimePayload>,
  ) => ({
    ...state,
    hasInstalledAnyApp,
  }),

  [SettingsActionTypes.SETTINGS_SET_READONLY_MODE]: (
    state: SettingsState,
    {
      payload: { readOnlyModeEnabled },
    }: Action<SettingsSetReadOnlyModePayload>,
  ) => ({
    ...state,
    readOnlyModeEnabled,
  }),

  [SettingsActionTypes.SETTINGS_SET_EXPERIMENTAL_USB_SUPPORT]: (
    state: SettingsState,
    {
      payload: { experimentalUSBEnabled },
    }: Action<SettingsSetExperimentalUsbSupportPayload>,
  ) => ({
    ...state,
    experimentalUSBEnabled,
  }),

  [SettingsActionTypes.SETTINGS_SWITCH_COUNTERVALUE_FIRST]: (
    state: SettingsState,
  ) => ({
    ...state,
    graphCountervalueFirst: !state.graphCountervalueFirst,
  }),

  [SettingsActionTypes.SETTINGS_HIDE_EMPTY_TOKEN_ACCOUNTS]: (
    state: SettingsState,
    {
      payload: { hideEmptyTokenAccounts },
    }: Action<SettingsHideEmptyTokenAccountsPayload>,
  ) => ({
    ...state,
    hideEmptyTokenAccounts,
  }),

  [SettingsActionTypes.SHOW_TOKEN]: (
    state: SettingsState,
    { payload: { tokenId } }: Action<SettingsShowTokenPayload>,
  ) => {
    const ids = state.blacklistedTokenIds;
    return { ...state, blacklistedTokenIds: ids.filter(id => id !== tokenId) };
  },

  [SettingsActionTypes.BLACKLIST_TOKEN]: (
    state: SettingsState,
    { payload: { tokenId } }: Action<SettingsBlacklistTokenPayload>,
  ) => {
    const ids = state.blacklistedTokenIds;
    return { ...state, blacklistedTokenIds: [...ids, tokenId] };
  },

  [SettingsActionTypes.HIDE_NFT_COLLECTION]: (
    state: SettingsState,
    { payload: { collectionId } }: Action<SettingsHideNftCollectionPayload>,
  ) => {
    const ids = state.hiddenNftCollections;
    return { ...state, hiddenNftCollections: [...ids, collectionId] };
  },

  [SettingsActionTypes.UNHIDE_NFT_COLLECTION]: (
    state: SettingsState,
    { payload: { collectionId } }: Action<SettingsUnhideNftCollectionPayload>,
  ) => {
    const ids = state.hiddenNftCollections;
    return {
      ...state,
      hiddenNftCollections: ids.filter(id => id !== collectionId),
    };
  },

  [SettingsActionTypes.SETTINGS_DISMISS_BANNER]: (
    state: SettingsState,
    { payload: { bannerId } }: Action<SettingsDismissBannerPayload>,
  ) => ({
    ...state,
    dismissedBanners: [...state.dismissedBanners, bannerId],
  }),

  [SettingsActionTypes.SETTINGS_SET_AVAILABLE_UPDATE]: (
    state: SettingsState,
    {
      payload: { hasAvailableUpdate },
    }: Action<SettingsSetAvailableUpdatePayload>,
  ) => ({
    ...state,
    hasAvailableUpdate,
  }),

  [SettingsActionTypes.DANGEROUSLY_OVERRIDE_STATE]: (
    state: SettingsState,
  ): SettingsState => ({
    ...state,
  }),

  [SettingsActionTypes.SETTINGS_SET_THEME]: (
    state: SettingsState,
    { payload: { theme } }: Action<SettingsSetThemePayload>,
  ) => ({
    ...state,
    theme,
  }),

  [SettingsActionTypes.SETTINGS_SET_OS_THEME]: (
    state: SettingsState,
    { payload: { osTheme } }: Action<SettingsSetOsThemePayload>,
  ) => ({
    ...state,
    osTheme,
  }),

  [SettingsActionTypes.SETTINGS_SET_CAROUSEL_VISIBILITY]: (
    state: SettingsState,
    {
      payload: { carouselVisibility },
    }: Action<SettingsSetCarouselVisibilityPayload>,
  ) => ({
    ...state,
    carouselVisibility,
  }),

  [SettingsActionTypes.SETTINGS_SET_DISCREET_MODE]: (
    state: SettingsState,
    { payload: { discreetMode } }: Action<SettingsSetDiscreetModePayload>,
  ) => ({
    ...state,
    discreetMode,
  }),

  [SettingsActionTypes.SETTINGS_SET_LANGUAGE]: (
    state: SettingsState,
    { payload: { language } }: Action<SettingsSetLanguagePayload>,
  ) => ({
    ...state,
    language,
    languageIsSetByUser: true,
  }),

  [SettingsActionTypes.SETTINGS_SET_LOCALE]: (
    state: SettingsState,
    { payload: { locale } }: Action<SettingsSetLocalePayload>,
  ) => ({
    ...state,
    locale,
  }),

  [SettingsActionTypes.SET_SWAP_SELECTABLE_CURRENCIES]: (
    state: SettingsState,
    {
      payload: { selectableCurrencies },
    }: Action<SettingsSetSwapSelectableCurrenciesPayload>,
  ) => ({
    ...state,
    swap: { ...state.swap, selectableCurrencies },
  }),

  [SettingsActionTypes.SET_SWAP_KYC]: (
    state: SettingsState,
    { payload }: Action<SettingsSetSwapKycPayload>,
  ) => {
    const { provider, id, status } = payload;
    const KYC = { ...state.swap.KYC };

    if (id && status) {
      KYC[provider] = {
        id,
        status,
      };
    } else {
      delete KYC[provider];
    }

    return { ...state, swap: { ...state.swap, KYC } };
  },

  [SettingsActionTypes.ACCEPT_SWAP_PROVIDER]: (
    state: SettingsState,
    {
      payload: { acceptedProvider },
    }: Action<SettingsAcceptSwapProviderPayload>,
  ) => ({
    ...state,
    swap: {
      ...state.swap,
      acceptedProviders: [
        ...new Set([
          ...(state.swap?.acceptedProviders || []),
          acceptedProvider,
        ]),
      ],
    },
  }),

  [SettingsActionTypes.LAST_SEEN_DEVICE_INFO]: (
    state: SettingsState,
    { payload: { dmi } }: Action<SettingsLastSeenDeviceInfoPayload>,
  ) => ({
    ...state,
    lastSeenDevice: { ...(state.lastSeenDevice || {}), ...dmi },
  }),

  [SettingsActionTypes.ADD_STARRED_MARKET_COINS]: (
    state: SettingsState,
    {
      payload: { starredMarketCoin },
    }: Action<SettingsAddStarredMarketcoinsPayload>,
  ) => ({
    ...state,
    starredMarketCoins: [...state.starredMarketCoins, starredMarketCoin],
  }),

  [SettingsActionTypes.REMOVE_STARRED_MARKET_COINS]: (
    state: SettingsState,
    {
      payload: { starredMarketCoin },
    }: Action<SettingsRemoveStarredMarketcoinsPayload>,
  ) => ({
    ...state,
    starredMarketCoins: state.starredMarketCoins.filter(
      id => id !== starredMarketCoin,
    ),
  }),

  [SettingsActionTypes.SET_LAST_CONNECTED_DEVICE]: (
    state: SettingsState,
    {
      payload: { lastConnectedDevice },
    }: Action<SettingsSetLastConnectedDevicePayload>,
  ) => ({ ...state, lastConnectedDevice }),

  [SettingsActionTypes.SET_HAS_ORDERED_NANO]: (
    state: SettingsState,
    { payload: { hasOrderedNano } }: Action<SettingsSetHasOrderedNanoPayload>,
  ) => ({
    ...state,
    hasOrderedNano,
  }),

  [SettingsActionTypes.SET_MARKET_REQUEST_PARAMS]: (
    state: SettingsState,
    {
      payload: { marketRequestParams },
    }: Action<SettingsSetMarketRequestParamsPayload>,
  ) => ({
    ...state,
    marketRequestParams: {
      ...state.marketRequestParams,
      ...marketRequestParams,
    },
  }),

  [SettingsActionTypes.SET_MARKET_COUNTER_CURRENCY]: (
    state: SettingsState,
    {
      payload: { marketCounterCurrency },
    }: Action<SettingsSetMarketCounterCurrencyPayload>,
  ) => ({
    ...state,
    marketCounterCurrency,
  }),

  [SettingsActionTypes.SET_MARKET_FILTER_BY_STARRED_ACCOUNTS]: (
    state: SettingsState,
    {
      payload: { marketFilterByStarredAccounts },
    }: Action<SettingsSetMarketFilterByStarredAccountsPayload>,
  ) => ({ ...state, marketFilterByStarredAccounts }),

  [SettingsActionTypes.SET_SENSITIVE_ANALYTICS]: (
    state: SettingsState,
    {
      payload: { sensitiveAnalytics },
    }: Action<SettingsSetSensitiveAnalyticsPayload>,
  ) => ({
    ...state,
    sensitiveAnalytics,
  }),

  [SettingsActionTypes.SET_FIRST_CONNECTION_HAS_DEVICE]: (
    state: SettingsState,
    {
      payload: { firstConnectionHasDevice },
    }: Action<SettingsSetFirstConnectionHasDevicePayload>,
  ) => ({
    ...state,
    firstConnectionHasDevice,
  }),

  [SettingsActionTypes.SET_NOTIFICATIONS]: (
    state: SettingsState,
    { payload: { notifications } }: Action<SettingsSetNotificationsPayload>,
  ) => ({
    ...state,
    notifications: { ...state.notifications, ...notifications },
  }),
};

export default handleActions<SettingsState, SettingsPayload>(
  handlers,
  INITIAL_STATE,
);

const storeSelector = (state: State): SettingsState => state.settings;

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
  s: State,
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
    return Object.fromEntries(SLIDES.map(slide => [slide.name, true]));
  }

  return settingValue;
};
export const discreetModeSelector = (state: State): boolean =>
  state.settings.discreetMode === true;

export const themeSelector = (state: State) => {
  const val = state.settings.theme;
  return val;
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
export const swapSelectableCurrenciesSelector = (state: State) =>
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
