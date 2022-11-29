import { handleActions, ReducerMap } from "redux-actions";
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
import type { AccountLike } from "@ledgerhq/types-live";
import { ValidKYCStatus } from "@ledgerhq/live-common/exchange/swap/types";
import type { CryptoCurrency, Currency } from "@ledgerhq/types-cryptoassets";
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
  SettingsSetFirstConnectHasDeviceUpdatedPayload,
  SettingsSetHasOrderedNanoPayload,
  SettingsSetLanguagePayload,
  SettingsSetLastConnectedDevicePayload,
  SettingsSetLocalePayload,
  SettingsSetMarketCounterCurrencyPayload,
  SettingsSetCustomImageBackupPayload,
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
import {
  SettingsActionTypes,
  SettingsSetWalletTabNavigatorLastVisitedTabPayload,
} from "../actions/types";
import { ScreenName } from "../const";

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
  hasCompletedCustomImageFlow: false,
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
  customImageBackup: undefined,

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
  firstConnectHasDeviceUpdated: null,
  notifications: {
    areNotificationsAllowed: true,
    announcementsCategory: true,
    recommendationsCategory: true,
  },
  walletTabNavigatorLastVisitedTab: ScreenName.Portfolio,
};

const pairHash = (from: { ticker: string }, to: { ticker: string }) =>
  `${from.ticker}_${to.ticker}`;

const handlers: ReducerMap<SettingsState, SettingsPayload> = {
  [SettingsActionTypes.SETTINGS_IMPORT]: (state, action) => ({
    ...state,
    ...(action as Action<SettingsImportPayload>).payload,
  }),

  [SettingsActionTypes.SETTINGS_IMPORT_DESKTOP]: (state, action) => {
    const {
      payload: { developerModeEnabled, ...rest },
    } = action as Action<SettingsImportDesktopPayload>;
    if (developerModeEnabled !== undefined)
      setEnvUnsafe("MANAGER_DEV_MODE", developerModeEnabled);
    return {
      ...state,
      ...rest,
      currenciesSettings: merge(
        state.currenciesSettings,
        rest.currenciesSettings,
      ),
    };
  },

  [SettingsActionTypes.UPDATE_CURRENCY_SETTINGS]: (
    { currenciesSettings, ...state }: SettingsState,
    action,
  ) => {
    const {
      payload: { ticker, patch },
    } = action as Action<SettingsUpdateCurrencyPayload>;
    return {
      ...state,
      currenciesSettings: {
        ...currenciesSettings,
        [ticker]: { ...currenciesSettings[ticker], ...patch },
      },
    };
  },

  [SettingsActionTypes.SETTINGS_SET_PRIVACY]: (state, action) => ({
    ...state,
    privacy: {
      ...state.privacy,
      ...(action as Action<SettingsSetPrivacyPayload>).payload.privacy,
    },
  }),

  [SettingsActionTypes.SETTINGS_SET_PRIVACY_BIOMETRICS]: (state, action) => ({
    ...state,
    privacy: {
      ...state.privacy,
      biometricsEnabled: (action as Action<SettingsSetPrivacyBiometricsPayload>)
        .payload.biometricsEnabled,
    },
  }),

  [SettingsActionTypes.SETTINGS_DISABLE_PRIVACY]: (state: SettingsState) => ({
    ...state,
    privacy: null,
  }),

  [SettingsActionTypes.SETTINGS_SET_REPORT_ERRORS]: (state, action) => ({
    ...state,
    reportErrorsEnabled: (action as Action<SettingsSetReportErrorsPayload>)
      .payload.reportErrorsEnabled,
  }),

  [SettingsActionTypes.SETTINGS_SET_ANALYTICS]: (state, action) => ({
    ...state,
    analyticsEnabled: (action as Action<SettingsSetAnalyticsPayload>).payload
      .analyticsEnabled,
  }),

  [SettingsActionTypes.SETTINGS_SET_COUNTERVALUE]: (state, action) => ({
    ...state,
    counterValue: (action as Action<SettingsSetCountervaluePayload>).payload
      .counterValue,
    counterValueExchange: null, // also reset the exchange
  }),

  [SettingsActionTypes.SETTINGS_SET_ORDER_ACCOUNTS]: (state, action) => ({
    ...state,
    orderAccounts: (action as Action<SettingsSetOrderAccountsPayload>).payload
      .orderAccounts,
  }),

  [SettingsActionTypes.SETTINGS_SET_PAIRS]: (state, action) => {
    const copy = { ...state };
    copy.pairExchanges = { ...copy.pairExchanges };
    const {
      payload: { pairs },
    } = action as Action<SettingsSetPairsPayload>;
    for (const { to, from, exchange } of pairs) {
      copy.pairExchanges[pairHash(from, to)] = exchange;
    }

    return copy;
  },

  [SettingsActionTypes.SETTINGS_SET_SELECTED_TIME_RANGE]: (state, action) => ({
    ...state,
    selectedTimeRange: (action as Action<SettingsSetSelectedTimeRangePayload>)
      .payload.selectedTimeRange,
  }),

  [SettingsActionTypes.SETTINGS_COMPLETE_CUSTOM_IMAGE_FLOW]: state => ({
    ...state,
    hasCompletedCustomImageFlow: true,
  }),

  [SettingsActionTypes.SETTINGS_COMPLETE_ONBOARDING]: state => ({
    ...state,
    hasCompletedOnboarding: true,
  }),

  [SettingsActionTypes.SETTINGS_INSTALL_APP_FIRST_TIME]: (state, action) => ({
    ...state,
    hasInstalledAnyApp: (action as Action<SettingsInstallAppFirstTimePayload>)
      .payload.hasInstalledAnyApp,
  }),

  [SettingsActionTypes.SETTINGS_SET_READONLY_MODE]: (state, action) => ({
    ...state,
    readOnlyModeEnabled: (action as Action<SettingsSetReadOnlyModePayload>)
      .payload.readOnlyModeEnabled,
  }),

  [SettingsActionTypes.SETTINGS_SET_EXPERIMENTAL_USB_SUPPORT]: (
    state,
    action,
  ) => ({
    ...state,
    experimentalUSBEnabled: (
      action as Action<SettingsSetExperimentalUsbSupportPayload>
    ).payload.experimentalUSBEnabled,
  }),

  [SettingsActionTypes.SETTINGS_SWITCH_COUNTERVALUE_FIRST]: state => ({
    ...state,
    graphCountervalueFirst: !state.graphCountervalueFirst,
  }),

  [SettingsActionTypes.SETTINGS_HIDE_EMPTY_TOKEN_ACCOUNTS]: (
    state,
    action,
  ) => ({
    ...state,
    hideEmptyTokenAccounts: (
      action as Action<SettingsHideEmptyTokenAccountsPayload>
    ).payload.hideEmptyTokenAccounts,
  }),

  [SettingsActionTypes.SHOW_TOKEN]: (state, action) => {
    const ids = state.blacklistedTokenIds;
    return {
      ...state,
      blacklistedTokenIds: ids.filter(
        id =>
          id !== (action as Action<SettingsShowTokenPayload>).payload.tokenId,
      ),
    };
  },

  [SettingsActionTypes.BLACKLIST_TOKEN]: (state, action) => {
    const ids = state.blacklistedTokenIds;
    return {
      ...state,
      blacklistedTokenIds: [
        ...ids,
        (action as Action<SettingsBlacklistTokenPayload>).payload.tokenId,
      ],
    };
  },

  [SettingsActionTypes.HIDE_NFT_COLLECTION]: (state, action) => {
    const ids = state.hiddenNftCollections;
    return {
      ...state,
      hiddenNftCollections: [
        ...ids,
        (action as Action<SettingsHideNftCollectionPayload>).payload
          .collectionId,
      ],
    };
  },

  [SettingsActionTypes.UNHIDE_NFT_COLLECTION]: (state, action) => {
    const ids = state.hiddenNftCollections;
    return {
      ...state,
      hiddenNftCollections: ids.filter(
        id =>
          id !==
          (action as Action<SettingsUnhideNftCollectionPayload>).payload
            .collectionId,
      ),
    };
  },

  [SettingsActionTypes.SETTINGS_DISMISS_BANNER]: (state, action) => ({
    ...state,
    dismissedBanners: [
      ...state.dismissedBanners,
      (action as Action<SettingsDismissBannerPayload>).payload.bannerId,
    ],
  }),

  [SettingsActionTypes.SETTINGS_SET_AVAILABLE_UPDATE]: (state, action) => ({
    ...state,
    hasAvailableUpdate: (action as Action<SettingsSetAvailableUpdatePayload>)
      .payload.hasAvailableUpdate,
  }),

  [SettingsActionTypes.DANGEROUSLY_OVERRIDE_STATE]: (state): SettingsState => ({
    ...state,
  }),

  [SettingsActionTypes.SETTINGS_SET_THEME]: (state, action) => ({
    ...state,
    theme: (action as Action<SettingsSetThemePayload>).payload.theme,
  }),

  [SettingsActionTypes.SETTINGS_SET_OS_THEME]: (state, action) => ({
    ...state,
    osTheme: (action as Action<SettingsSetOsThemePayload>).payload.osTheme,
  }),

  [SettingsActionTypes.SETTINGS_SET_CAROUSEL_VISIBILITY]: (state, action) => ({
    ...state,
    carouselVisibility: (action as Action<SettingsSetCarouselVisibilityPayload>)
      .payload.carouselVisibility,
  }),

  [SettingsActionTypes.SETTINGS_SET_DISCREET_MODE]: (state, action) => ({
    ...state,
    discreetMode: (action as Action<SettingsSetDiscreetModePayload>).payload
      .discreetMode,
  }),

  [SettingsActionTypes.SETTINGS_SET_LANGUAGE]: (state, action) => ({
    ...state,
    language: (action as Action<SettingsSetLanguagePayload>).payload.language,
    languageIsSetByUser: true,
  }),

  [SettingsActionTypes.SETTINGS_SET_LOCALE]: (state, action) => ({
    ...state,
    locale: (action as Action<SettingsSetLocalePayload>).payload.locale,
  }),

  [SettingsActionTypes.SET_SWAP_SELECTABLE_CURRENCIES]: (state, action) => ({
    ...state,
    swap: {
      ...state.swap,
      selectableCurrencies: (
        action as Action<SettingsSetSwapSelectableCurrenciesPayload>
      ).payload.selectableCurrencies,
    },
  }),

  [SettingsActionTypes.SET_SWAP_KYC]: (state, action) => {
    const { provider, id, status } = (
      action as Action<SettingsSetSwapKycPayload>
    ).payload;
    const KYC = { ...state.swap.KYC };

    // If we have an id but a "null" KYC status, this means user is logged in to provider but has not gone through KYC yet
    if (id && typeof status !== "undefined") {
      KYC[provider as keyof typeof KYC] = {
        id,
        status: status as ValidKYCStatus,
      };
    } else {
      delete KYC[provider as keyof typeof KYC];
    }

    return { ...state, swap: { ...state.swap, KYC } };
  },

  [SettingsActionTypes.ACCEPT_SWAP_PROVIDER]: (state, action) => ({
    ...state,
    swap: {
      ...state.swap,
      acceptedProviders: [
        ...new Set([
          ...(state.swap?.acceptedProviders || []),
          (action as Action<SettingsAcceptSwapProviderPayload>).payload
            .acceptedProvider,
        ]),
      ],
    },
  }),

  [SettingsActionTypes.LAST_SEEN_DEVICE_INFO]: (state, action) => ({
    ...state,
    lastSeenDevice: {
      ...(state.lastSeenDevice || {}),
      ...(action as Action<SettingsLastSeenDeviceInfoPayload>).payload.dmi,
    },
  }),

  [SettingsActionTypes.ADD_STARRED_MARKET_COINS]: (state, action) => ({
    ...state,
    starredMarketCoins: [
      ...state.starredMarketCoins,
      (action as Action<SettingsAddStarredMarketcoinsPayload>).payload
        .starredMarketCoin,
    ],
  }),

  [SettingsActionTypes.REMOVE_STARRED_MARKET_COINS]: (state, action) => ({
    ...state,
    starredMarketCoins: state.starredMarketCoins.filter(
      id =>
        id !==
        (action as Action<SettingsRemoveStarredMarketcoinsPayload>).payload
          .starredMarketCoin,
    ),
  }),

  [SettingsActionTypes.SET_CUSTOM_IMAGE_BACKUP]: (state, action) => ({
    ...state,
    customImageBackup: (action as Action<SettingsSetCustomImageBackupPayload>)
      .payload,
  }),

  [SettingsActionTypes.SET_LAST_CONNECTED_DEVICE]: (state, action) => ({
    ...state,
    lastConnectedDevice: (
      action as Action<SettingsSetLastConnectedDevicePayload>
    ).payload.lastConnectedDevice,
  }),

  [SettingsActionTypes.SET_HAS_ORDERED_NANO]: (state, action) => ({
    ...state,
    hasOrderedNano: (action as Action<SettingsSetHasOrderedNanoPayload>).payload
      .hasOrderedNano,
  }),

  [SettingsActionTypes.SET_MARKET_REQUEST_PARAMS]: (state, action) => ({
    ...state,
    marketRequestParams: {
      ...state.marketRequestParams,
      ...(action as Action<SettingsSetMarketRequestParamsPayload>).payload
        .marketRequestParams,
    },
  }),

  [SettingsActionTypes.SET_MARKET_COUNTER_CURRENCY]: (state, action) => ({
    ...state,
    marketCounterCurrency: (
      action as Action<SettingsSetMarketCounterCurrencyPayload>
    ).payload.marketCounterCurrency,
  }),
  [SettingsActionTypes.SET_MARKET_FILTER_BY_STARRED_ACCOUNTS]: (
    state,
    action,
  ) => ({
    ...state,
    marketFilterByStarredAccounts: (
      action as Action<SettingsSetMarketFilterByStarredAccountsPayload>
    ).payload.marketFilterByStarredAccounts,
  }),
  [SettingsActionTypes.SET_SENSITIVE_ANALYTICS]: (state, action) => ({
    ...state,
    sensitiveAnalytics: (action as Action<SettingsSetSensitiveAnalyticsPayload>)
      .payload.sensitiveAnalytics,
  }),

  [SettingsActionTypes.SET_FIRST_CONNECTION_HAS_DEVICE]: (state, action) => ({
    ...state,
    firstConnectHasDeviceUpdated: (
      action as Action<SettingsSetFirstConnectHasDeviceUpdatedPayload>
    ).payload.firstConnectHasDeviceUpdated,
  }),

  [SettingsActionTypes.SET_NOTIFICATIONS]: (state, action) => ({
    ...state,
    notifications: {
      ...state.notifications,
      ...(action as Action<SettingsSetNotificationsPayload>).payload
        .notifications,
    },
  }),

  [SettingsActionTypes.RESET_SWAP_LOGIN_AND_KYC_DATA]: (
    state: SettingsState,
  ) => ({
    ...state,
    swap: {
      ...state.swap,
      KYC: {},
    },
  }),

  [SettingsActionTypes.WALLET_TAB_NAVIGATOR_LAST_VISITED_TAB]: (
    state,
    action,
  ) => ({
    ...state,
    walletTabNavigatorLastVisitedTab: (
      action as Action<SettingsSetWalletTabNavigatorLastVisitedTabPayload>
    ).payload.walletTabNavigatorLastVisitedTab,
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
export const hasCompletedCustomImageFlowSelector = (state: State) =>
  state.settings.hasCompletedCustomImageFlow;
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
export const customImageBackupSelector = (state: State) =>
  state.settings.customImageBackup;
export const sensitiveAnalyticsSelector = (state: State) =>
  state.settings.sensitiveAnalytics;
export const firstConnectionHasDeviceSelector = (state: State) =>
  state.settings.firstConnectionHasDevice;
export const firstConnectHasDeviceUpdatedSelector = (state: State) =>
  state.settings.firstConnectHasDeviceUpdated;
export const notificationsSelector = (state: State) =>
  state.settings.notifications;
export const walletTabNavigatorLastVisitedTabSelector = (state: State) =>
  state.settings.walletTabNavigatorLastVisitedTab;
