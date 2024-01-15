import { handleActions, ReducerMap } from "redux-actions";
import type { Action } from "redux-actions";
import merge from "lodash/merge";
import {
  findCurrencyByTicker,
  getFiatCurrencyByTicker,
} from "@ledgerhq/live-common/currencies/index";
import { getEnv, setEnvUnsafe } from "@ledgerhq/live-env";
import { createSelector } from "reselect";
import { getAccountCurrency } from "@ledgerhq/live-common/account/helpers";
import type { AccountLike } from "@ledgerhq/types-live";
import type { CryptoCurrency, Currency } from "@ledgerhq/types-cryptoassets";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { CurrencySettings, SettingsState, State } from "./types";
import { currencySettingsDefaults } from "../helpers/CurrencySettingsDefaults";
import { getDefaultLanguageLocale, getDefaultLocale } from "../languages";
import type {
  SettingsAcceptSwapProviderPayload,
  SettingsAddStarredMarketcoinsPayload,
  SettingsBlacklistTokenPayload,
  SettingsDismissBannerPayload,
  SettingsHideEmptyTokenAccountsPayload,
  SettingsFilterTokenOperationsZeroAmountPayload,
  SettingsHideNftCollectionPayload,
  SettingsImportDesktopPayload,
  SettingsImportPayload,
  SettingsSetHasInstalledAnyAppPayload,
  SettingsLastSeenDeviceInfoPayload,
  SettingsPayload,
  SettingsRemoveStarredMarketcoinsPayload,
  SettingsSetAnalyticsPayload,
  SettingsSetAvailableUpdatePayload,
  SettingsSetCountervaluePayload,
  SettingsSetDiscreetModePayload,
  SettingsSetHasOrderedNanoPayload,
  SettingsSetLanguagePayload,
  SettingsSetLastConnectedDevicePayload,
  SettingsSetLocalePayload,
  SettingsSetMarketCounterCurrencyPayload,
  SettingsSetCustomImageBackupPayload,
  SettingsSetLastSeenCustomImagePayload,
  SettingsSetMarketFilterByStarredAccountsPayload,
  SettingsSetMarketRequestParamsPayload,
  SettingsSetNotificationsPayload,
  SettingsSetNeverClickedOnAllowNotificationsButton,
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
  SettingsSetDismissedDynamicCardsPayload,
  SettingsSetOverriddenFeatureFlagPlayload,
  SettingsSetOverriddenFeatureFlagsPlayload,
  SettingsSetFeatureFlagsBannerVisiblePayload,
  DangerouslyOverrideStatePayload,
  SettingsLastSeenDeviceLanguagePayload,
  SettingsCompleteOnboardingPayload,
  SettingsSetDateFormatPayload,
  SettingsSetDebugAppLevelDrawerOpenedPayload,
  SettingsSetHasBeenUpsoldProtectPayload,
  SettingsSetHasSeenStaxEnabledNftsPopupPayload,
  SettingsSetCustomImageTypePayload,
  SettingsSetGeneralTermsVersionAccepted,
  SettingsSetOnboardingHasDevicePayload,
  SettingsSetOnboardingTypePayload,
  SettingsSetKnownDeviceModelIdsPayload,
  SettingsSetClosedNetworkBannerPayload,
  SettingsSetClosedWithdrawBannerPayload,
  SettingsSetUserNps,
  SettingsSetSupportedCounterValues,
} from "../actions/types";
import {
  SettingsActionTypes,
  SettingsSetWalletTabNavigatorLastVisitedTabPayload,
} from "../actions/types";
import { ScreenName } from "~/const";

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
  countervalueFirst: true,
  graphCountervalueFirst: true,
  hideEmptyTokenAccounts: false,
  filterTokenOperationsZeroAmount: true,
  blacklistedTokenIds: [],
  hiddenNftCollections: [],
  dismissedBanners: [],
  hasAvailableUpdate: false,
  theme: "system",
  osTheme: undefined,
  customImageType: null,
  customImageBackup: undefined,
  lastSeenCustomImage: {
    size: 0,
    hash: "",
  },
  dismissedDynamicCards: [],
  discreetMode: false,
  language: getDefaultLanguageLocale(),
  languageIsSetByUser: false,
  locale: null,
  swap: {
    hasAcceptedIPSharing: false,
    acceptedProviders: [],
    selectableCurrencies: [],
  },
  lastSeenDevice: null,
  knownDeviceModelIds: {
    blue: false,
    nanoS: false,
    nanoSP: false,
    nanoX: false,
    stax: false,
  },
  hasSeenStaxEnabledNftsPopup: false,
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
  onboardingHasDevice: null,
  notifications: {
    areNotificationsAllowed: true,
    announcementsCategory: true,
    recommendationsCategory: true,
    largeMoverCategory: true,
    transactionsAlertsCategory: false,
  },
  neverClickedOnAllowNotificationsButton: true,
  walletTabNavigatorLastVisitedTab: ScreenName.Portfolio,
  overriddenFeatureFlags: {},
  featureFlagsBannerVisible: false,
  debugAppLevelDrawerOpened: false,
  dateFormat: "default",
  hasBeenUpsoldProtect: false,
  onboardingType: null,
  depositFlow: {
    hasClosedNetworkBanner: false,
    hasClosedWithdrawBanner: false,
  },
  userNps: null,
  supportedCounterValues: [],
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
    if (developerModeEnabled !== undefined) setEnvUnsafe("MANAGER_DEV_MODE", developerModeEnabled);
    return {
      ...state,
      ...rest,
      currenciesSettings: merge(state.currenciesSettings, rest.currenciesSettings),
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
      ...(action as Action<SettingsSetPrivacyPayload>).payload,
    },
  }),

  [SettingsActionTypes.SETTINGS_SET_PRIVACY_BIOMETRICS]: (state, action) => ({
    ...state,
    privacy: {
      ...state.privacy,
      hasPassword: state.privacy?.hasPassword || false,
      biometricsEnabled: (action as Action<SettingsSetPrivacyBiometricsPayload>).payload,
    },
  }),

  [SettingsActionTypes.SETTINGS_DISABLE_PRIVACY]: (state: SettingsState) => ({
    ...state,
    privacy: {
      ...state.privacy,
      hasPassword: false,
      biometricsEnabled: false,
    },
  }),

  [SettingsActionTypes.SETTINGS_SET_REPORT_ERRORS]: (state, action) => ({
    ...state,
    reportErrorsEnabled: (action as Action<SettingsSetReportErrorsPayload>).payload,
  }),

  [SettingsActionTypes.SETTINGS_SET_ANALYTICS]: (state, action) => ({
    ...state,
    analyticsEnabled: (action as Action<SettingsSetAnalyticsPayload>).payload,
  }),

  [SettingsActionTypes.SETTINGS_SET_COUNTERVALUE]: (state, action) => ({
    ...state,
    counterValue: (action as Action<SettingsSetCountervaluePayload>).payload,
    counterValueExchange: null, // also reset the exchange
  }),

  [SettingsActionTypes.SETTINGS_SET_ORDER_ACCOUNTS]: (state, action) => ({
    ...state,
    orderAccounts: (action as Action<SettingsSetOrderAccountsPayload>).payload,
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
    selectedTimeRange: (action as Action<SettingsSetSelectedTimeRangePayload>).payload,
  }),

  [SettingsActionTypes.SETTINGS_COMPLETE_CUSTOM_IMAGE_FLOW]: state => ({
    ...state,
    hasCompletedCustomImageFlow: true,
  }),

  [SettingsActionTypes.SET_LAST_SEEN_CUSTOM_IMAGE]: (state, action) => ({
    ...state,
    lastSeenCustomImage: {
      size: (action as Action<SettingsSetLastSeenCustomImagePayload>).payload.imageSize,
      hash: (action as Action<SettingsSetLastSeenCustomImagePayload>).payload.imageHash,
    },
  }),

  [SettingsActionTypes.SETTINGS_COMPLETE_ONBOARDING]: (state, action) => {
    const payload = (action as Action<SettingsCompleteOnboardingPayload>).payload;
    return {
      ...state,
      hasCompletedOnboarding: payload === false ? payload : true,
    };
  },

  [SettingsActionTypes.SETTINGS_SET_HAS_INSTALLED_ANY_APP]: (state, action) => ({
    ...state,
    hasInstalledAnyApp: (action as Action<SettingsSetHasInstalledAnyAppPayload>).payload,
  }),

  [SettingsActionTypes.SETTINGS_SET_READONLY_MODE]: (state, action) => ({
    ...state,
    readOnlyModeEnabled: (action as Action<SettingsSetReadOnlyModePayload>).payload,
  }),

  [SettingsActionTypes.SETTINGS_SWITCH_COUNTERVALUE_FIRST]: state => ({
    ...state,
    graphCountervalueFirst: !state.graphCountervalueFirst,
  }),

  [SettingsActionTypes.SETTINGS_HIDE_EMPTY_TOKEN_ACCOUNTS]: (state, action) => ({
    ...state,
    hideEmptyTokenAccounts: (action as Action<SettingsHideEmptyTokenAccountsPayload>).payload,
  }),

  [SettingsActionTypes.SETTINGS_FILTER_TOKEN_OPERATIONS_ZERO_AMOUNT]: (state, action) => ({
    ...state,
    filterTokenOperationsZeroAmount: (
      action as Action<SettingsFilterTokenOperationsZeroAmountPayload>
    ).payload,
  }),

  [SettingsActionTypes.SHOW_TOKEN]: (state, action) => {
    const ids = state.blacklistedTokenIds;
    return {
      ...state,
      blacklistedTokenIds: ids.filter(
        id => id !== (action as Action<SettingsShowTokenPayload>).payload,
      ),
    };
  },

  [SettingsActionTypes.BLACKLIST_TOKEN]: (state, action) => {
    const ids = state.blacklistedTokenIds;
    return {
      ...state,
      blacklistedTokenIds: [...ids, (action as Action<SettingsBlacklistTokenPayload>).payload],
    };
  },

  [SettingsActionTypes.HIDE_NFT_COLLECTION]: (state, action) => {
    const ids = state.hiddenNftCollections;
    return {
      ...state,
      hiddenNftCollections: [...ids, (action as Action<SettingsHideNftCollectionPayload>).payload],
    };
  },

  [SettingsActionTypes.UNHIDE_NFT_COLLECTION]: (state, action) => {
    const ids = state.hiddenNftCollections;
    return {
      ...state,
      hiddenNftCollections: ids.filter(
        id => id !== (action as Action<SettingsUnhideNftCollectionPayload>).payload,
      ),
    };
  },

  [SettingsActionTypes.SETTINGS_DISMISS_BANNER]: (state, action) => ({
    ...state,
    dismissedBanners: [
      ...state.dismissedBanners,
      (action as Action<SettingsDismissBannerPayload>).payload,
    ],
  }),

  [SettingsActionTypes.SETTINGS_SET_AVAILABLE_UPDATE]: (state, action) => ({
    ...state,
    hasAvailableUpdate: (action as Action<SettingsSetAvailableUpdatePayload>).payload,
  }),

  [SettingsActionTypes.DANGEROUSLY_OVERRIDE_STATE]: (state, action): SettingsState => ({
    ...state,
    ...(action as Action<DangerouslyOverrideStatePayload>).payload.settings,
  }),

  [SettingsActionTypes.SETTINGS_SET_THEME]: (state, action) => ({
    ...state,
    theme: (action as Action<SettingsSetThemePayload>).payload,
  }),

  [SettingsActionTypes.SETTINGS_SET_OS_THEME]: (state, action) => ({
    ...state,
    osTheme: (action as Action<SettingsSetOsThemePayload>).payload,
  }),

  [SettingsActionTypes.SETTINGS_SET_DISMISSED_DYNAMIC_CARDS]: (state, action) => ({
    ...state,
    dismissedDynamicCards: (action as Action<SettingsSetDismissedDynamicCardsPayload>).payload,
  }),

  [SettingsActionTypes.SETTINGS_SET_DISCREET_MODE]: (state, action) => ({
    ...state,
    discreetMode: (action as Action<SettingsSetDiscreetModePayload>).payload,
  }),

  [SettingsActionTypes.SETTINGS_SET_LANGUAGE]: (state, action) => ({
    ...state,
    language: (action as Action<SettingsSetLanguagePayload>).payload,
    languageIsSetByUser: true,
  }),

  [SettingsActionTypes.SETTINGS_SET_LOCALE]: (state, action) => ({
    ...state,
    locale: (action as Action<SettingsSetLocalePayload>).payload,
  }),

  [SettingsActionTypes.SET_SWAP_SELECTABLE_CURRENCIES]: (state, action) => ({
    ...state,
    swap: {
      ...state.swap,
      selectableCurrencies: (action as Action<SettingsSetSwapSelectableCurrenciesPayload>).payload,
    },
  }),

  [SettingsActionTypes.ACCEPT_SWAP_PROVIDER]: (state, action) => ({
    ...state,
    swap: {
      ...state.swap,
      acceptedProviders: [
        ...new Set([
          ...(state.swap?.acceptedProviders || []),
          (action as Action<SettingsAcceptSwapProviderPayload>).payload,
        ]),
      ],
    },
  }),

  [SettingsActionTypes.LAST_SEEN_DEVICE_INFO]: (state, action) => ({
    ...state,
    lastSeenDevice: {
      ...(state.lastSeenDevice || {}),
      ...(action as Action<SettingsLastSeenDeviceInfoPayload>).payload,
    },
    knownDeviceModelIds: {
      ...state.knownDeviceModelIds,
      [(action as Action<SettingsLastSeenDeviceInfoPayload>).payload.modelId]: true,
    },
  }),

  [SettingsActionTypes.SET_KNOWN_DEVICE_MODEL_IDS]: (state, action) => ({
    ...state,
    knownDeviceModelIds: {
      ...state.knownDeviceModelIds,
      ...(action as Action<SettingsSetKnownDeviceModelIdsPayload>).payload,
    },
  }),

  [SettingsActionTypes.SET_CUSTOM_IMAGE_TYPE]: (state, action) => ({
    ...state,
    customImageType: (action as Action<SettingsSetCustomImageTypePayload>).payload.customImageType,
  }),

  [SettingsActionTypes.SET_HAS_SEEN_STAX_ENABLED_NFTS_POPUP]: (state, action) => ({
    ...state,
    hasSeenStaxEnabledNftsPopup: (action as Action<SettingsSetHasSeenStaxEnabledNftsPopupPayload>)
      .payload.hasSeenStaxEnabledNftsPopup,
  }),

  [SettingsActionTypes.LAST_SEEN_DEVICE_LANGUAGE_ID]: (state, action) => {
    if (!state.lastSeenDevice) return state;
    return {
      ...state,
      lastSeenDevice: {
        ...state.lastSeenDevice,
        deviceInfo: {
          ...state.lastSeenDevice.deviceInfo,
          languageId: (action as Action<SettingsLastSeenDeviceLanguagePayload>).payload,
        },
      },
    };
  },

  [SettingsActionTypes.ADD_STARRED_MARKET_COINS]: (state, action) => ({
    ...state,
    starredMarketCoins: [
      ...state.starredMarketCoins,
      (action as Action<SettingsAddStarredMarketcoinsPayload>).payload,
    ],
  }),

  [SettingsActionTypes.REMOVE_STARRED_MARKET_COINS]: (state, action) => ({
    ...state,
    starredMarketCoins: state.starredMarketCoins.filter(
      id => id !== (action as Action<SettingsRemoveStarredMarketcoinsPayload>).payload,
    ),
  }),

  [SettingsActionTypes.SET_CUSTOM_IMAGE_BACKUP]: (state, action) => ({
    ...state,
    customImageBackup: (action as Action<SettingsSetCustomImageBackupPayload>).payload,
  }),

  [SettingsActionTypes.SET_LAST_CONNECTED_DEVICE]: (state, action) => ({
    ...state,
    lastConnectedDevice: (action as Action<SettingsSetLastConnectedDevicePayload>).payload,
    knownDeviceModelIds: {
      ...state.knownDeviceModelIds,
      [(action as Action<SettingsSetLastConnectedDevicePayload>).payload.modelId]: true,
    },
  }),

  [SettingsActionTypes.SET_HAS_ORDERED_NANO]: (state, action) => ({
    ...state,
    hasOrderedNano: (action as Action<SettingsSetHasOrderedNanoPayload>).payload,
  }),

  [SettingsActionTypes.SET_MARKET_REQUEST_PARAMS]: (state, action) => ({
    ...state,
    marketRequestParams: {
      ...state.marketRequestParams,
      ...(action as Action<SettingsSetMarketRequestParamsPayload>).payload,
    },
  }),

  [SettingsActionTypes.SET_MARKET_COUNTER_CURRENCY]: (state, action) => ({
    ...state,
    marketCounterCurrency: (action as Action<SettingsSetMarketCounterCurrencyPayload>).payload,
  }),

  [SettingsActionTypes.SET_MARKET_FILTER_BY_STARRED_ACCOUNTS]: (state, action) => ({
    ...state,
    marketFilterByStarredAccounts: (
      action as Action<SettingsSetMarketFilterByStarredAccountsPayload>
    ).payload,
  }),

  [SettingsActionTypes.SET_SENSITIVE_ANALYTICS]: (state, action) => ({
    ...state,
    sensitiveAnalytics: (action as Action<SettingsSetSensitiveAnalyticsPayload>).payload,
  }),

  [SettingsActionTypes.SET_ONBOARDING_HAS_DEVICE]: (state, action) => ({
    ...state,
    onboardingHasDevice: (action as Action<SettingsSetOnboardingHasDevicePayload>).payload,
  }),

  [SettingsActionTypes.SET_ONBOARDING_TYPE]: (state, action) => ({
    ...state,
    onboardingType: (action as Action<SettingsSetOnboardingTypePayload>).payload,
  }),

  [SettingsActionTypes.SET_CLOSED_NETWORK_BANNER]: (state, action) => ({
    ...state,
    depositFlow: {
      ...state.depositFlow,
      hasClosedNetworkBanner: (action as Action<SettingsSetClosedNetworkBannerPayload>).payload,
    },
  }),

  [SettingsActionTypes.SET_CLOSED_WITHDRAW_BANNER]: (state, action) => ({
    ...state,
    depositFlow: {
      ...state.depositFlow,
      hasClosedWithdrawBanner: (action as Action<SettingsSetClosedWithdrawBannerPayload>).payload,
    },
  }),

  [SettingsActionTypes.SET_NOTIFICATIONS]: (state, action) => ({
    ...state,
    notifications: {
      ...state.notifications,
      ...(action as Action<SettingsSetNotificationsPayload>).payload,
    },
  }),

  [SettingsActionTypes.SET_NEVER_CLICKED_ON_ALLOW_NOTIFICATIONS_BUTTON]: (state, action) => ({
    ...state,
    neverClickedOnAllowNotificationsButton: (
      action as Action<SettingsSetNeverClickedOnAllowNotificationsButton>
    ).payload,
  }),

  [SettingsActionTypes.WALLET_TAB_NAVIGATOR_LAST_VISITED_TAB]: (state, action) => ({
    ...state,
    walletTabNavigatorLastVisitedTab: (
      action as Action<SettingsSetWalletTabNavigatorLastVisitedTabPayload>
    ).payload,
  }),

  [SettingsActionTypes.SETTINGS_SET_DATE_FORMAT]: (state, action) => ({
    ...state,
    dateFormat: (action as Action<SettingsSetDateFormatPayload>).payload,
  }),

  [SettingsActionTypes.SET_OVERRIDDEN_FEATURE_FLAG]: (state, action) => {
    const { id, value } = (action as Action<SettingsSetOverriddenFeatureFlagPlayload>).payload;
    return {
      ...state,
      overriddenFeatureFlags: {
        ...state.overriddenFeatureFlags,
        [id]: value,
      },
    };
  },

  [SettingsActionTypes.SET_OVERRIDDEN_FEATURE_FLAGS]: (state, action) => ({
    ...state,
    overriddenFeatureFlags: (action as Action<SettingsSetOverriddenFeatureFlagsPlayload>).payload,
  }),

  [SettingsActionTypes.SET_FEATURE_FLAGS_BANNER_VISIBLE]: (state, action) => ({
    ...state,
    featureFlagsBannerVisible: (action as Action<SettingsSetFeatureFlagsBannerVisiblePayload>)
      .payload,
  }),

  [SettingsActionTypes.SET_DEBUG_APP_LEVEL_DRAWER_OPENED]: (state, action) => ({
    ...state,
    debugAppLevelDrawerOpened: (action as Action<SettingsSetDebugAppLevelDrawerOpenedPayload>)
      .payload,
  }),

  [SettingsActionTypes.SET_HAS_BEEN_UPSOLD_PROTECT]: (state, action) => ({
    ...state,
    hasBeenUpsoldProtect: (action as Action<SettingsSetHasBeenUpsoldProtectPayload>).payload,
  }),
  [SettingsActionTypes.SET_GENERAL_TERMS_VERSION_ACCEPTED]: (state, action) => ({
    ...state,
    generalTermsVersionAccepted: (action as Action<SettingsSetGeneralTermsVersionAccepted>).payload,
  }),
  [SettingsActionTypes.SET_USER_NPS]: (state, action) => ({
    ...state,
    userNps: (action as Action<SettingsSetUserNps>).payload,
  }),
  [SettingsActionTypes.SET_SUPPORTED_COUNTER_VALUES]: (state, action) => ({
    ...state,
    supportedCounterValues: (action as Action<SettingsSetSupportedCounterValues>).payload,
  }),
};

export default handleActions<SettingsState, SettingsPayload>(handlers, INITIAL_STATE);

const storeSelector = (state: State): SettingsState => state.settings;

export const exportSelector = storeSelector;

const counterValueCurrencyLocalSelector = (state: SettingsState): Currency =>
  findCurrencyByTicker(state.counterValue) || getFiatCurrencyByTicker("USD");

export const counterValueCurrencySelector = createSelector(
  storeSelector,
  counterValueCurrencyLocalSelector,
);

const counterValueExchangeLocalSelector = (s: SettingsState) => s.counterValueExchange;

export const counterValueExchangeSelector = createSelector(
  storeSelector,
  counterValueExchangeLocalSelector,
);

const defaultCurrencySettingsForCurrency: (_: Currency) => CurrencySettings = crypto => {
  const defaults = currencySettingsDefaults(crypto);
  return {
    confirmationsNb: defaults.confirmationsNb ? defaults.confirmationsNb.def : 0,
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
export const analyticsEnabledSelector = createSelector(storeSelector, s => s.analyticsEnabled);
export const lastSeenCustomImageSelector = createSelector(
  storeSelector,
  s => s.lastSeenCustomImage,
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
): string | null | undefined => state.settings.pairExchanges[pairHash(from, to)];
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
export const selectedTimeRangeSelector = (state: State) => state.settings.selectedTimeRange;
export const orderAccountsSelector = (state: State) => state.settings.orderAccounts;
export const hasCompletedCustomImageFlowSelector = (state: State) =>
  state.settings.hasCompletedCustomImageFlow;
export const hasCompletedOnboardingSelector = (state: State) =>
  state.settings.hasCompletedOnboarding;
export const hasInstalledAnyAppSelector = (state: State) => state.settings.hasInstalledAnyApp;
export const countervalueFirstSelector = (state: State) => state.settings.graphCountervalueFirst;
export const readOnlyModeEnabledSelector = (state: State) => state.settings.readOnlyModeEnabled;
export const blacklistedTokenIdsSelector = (state: State) => state.settings.blacklistedTokenIds;
export const hiddenNftCollectionsSelector = (state: State) => state.settings.hiddenNftCollections;
export const exportSettingsSelector = createSelector(
  counterValueCurrencySelector,
  () => getEnv("MANAGER_DEV_MODE"),
  state => state.settings.currenciesSettings,
  state => state.settings.pairExchanges,
  (counterValueCurrency, developerModeEnabled, currenciesSettings, pairExchanges) => ({
    counterValue: counterValueCurrency.ticker,
    currenciesSettings,
    pairExchanges,
    developerModeEnabled,
  }),
);
export const hideEmptyTokenAccountsEnabledSelector = (state: State) =>
  state.settings.hideEmptyTokenAccounts;
export const filterTokenOperationsZeroAmountEnabledSelector = (state: State) =>
  state.settings.filterTokenOperationsZeroAmount;
export const dismissedBannersSelector = (state: State) => state.settings.dismissedBanners;
export const hasAvailableUpdateSelector = (state: State) => state.settings.hasAvailableUpdate;
export const dismissedDynamicCardsSelector = (state: State) => state.settings.dismissedDynamicCards;
export const discreetModeSelector = (state: State): boolean => state.settings.discreetMode === true;

export const themeSelector = (state: State) => {
  const val = state.settings.theme;
  return val;
};
export const osThemeSelector = (state: State) => state.settings.osTheme;
export const languageSelector = (state: State) =>
  state.settings.language || getDefaultLanguageLocale();
export const languageIsSetByUserSelector = (state: State) => state.settings.languageIsSetByUser;
export const localeSelector = (state: State) => state.settings.locale || getDefaultLocale();
export const swapHasAcceptedIPSharingSelector = (state: State) =>
  state.settings.swap.hasAcceptedIPSharing;
export const swapSelectableCurrenciesSelector = (state: State) =>
  state.settings.swap.selectableCurrencies;
export const swapAcceptedProvidersSelector = (state: State) =>
  state.settings.swap.acceptedProviders;
export const lastSeenDeviceSelector = (state: State) => {
  // Nb workaround to prevent crash for dev/qa that have nanoFTS references.
  // to be removed in a while.
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (state.settings.lastSeenDevice?.modelId === "nanoFTS") {
    return { ...state.settings.lastSeenDevice, modelId: DeviceModelId.stax };
  }
  return state.settings.lastSeenDevice;
};
export const knownDeviceModelIdsSelector = (state: State) => state.settings.knownDeviceModelIds;
export const hasSeenStaxEnabledNftsPopupSelector = (state: State) =>
  state.settings.hasSeenStaxEnabledNftsPopup;
export const customImageTypeSelector = (state: State) => state.settings.customImageType;
export const starredMarketCoinsSelector = (state: State) => state.settings.starredMarketCoins;
export const lastConnectedDeviceSelector = (state: State) => {
  // Nb workaround to prevent crash for dev/qa that have nanoFTS references.
  // to be removed in a while.
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (state.settings.lastConnectedDevice?.modelId === "nanoFTS") {
    return {
      ...state.settings.lastConnectedDevice,
      modelId: DeviceModelId.stax,
    };
  }

  return state.settings.lastConnectedDevice;
};
export const hasOrderedNanoSelector = (state: State) => state.settings.hasOrderedNano;
export const marketRequestParamsSelector = (state: State) => state.settings.marketRequestParams;
export const marketCounterCurrencySelector = (state: State) => state.settings.marketCounterCurrency;
export const marketFilterByStarredAccountsSelector = (state: State) =>
  state.settings.marketFilterByStarredAccounts;
export const customImageBackupSelector = (state: State) => state.settings.customImageBackup;
export const sensitiveAnalyticsSelector = (state: State) => state.settings.sensitiveAnalytics;
export const onboardingHasDeviceSelector = (state: State) => state.settings.onboardingHasDevice;
export const onboardingTypeSelector = (state: State) => state.settings.onboardingType;
export const hasClosedNetworkBannerSelector = (state: State) =>
  state.settings.depositFlow.hasClosedNetworkBanner;
export const hasClosedWithdrawBannerSelector = (state: State) =>
  state.settings.depositFlow.hasClosedWithdrawBanner;
export const notificationsSelector = (state: State) => state.settings.notifications;
export const neverClickedOnAllowNotificationsButtonSelector = (s: State) =>
  s.settings.neverClickedOnAllowNotificationsButton;
export const walletTabNavigatorLastVisitedTabSelector = (state: State) =>
  state.settings.walletTabNavigatorLastVisitedTab;
export const dateFormatSelector = (state: State) => state.settings.dateFormat;
export const overriddenFeatureFlagsSelector = (state: State) =>
  state.settings.overriddenFeatureFlags;
export const featureFlagsBannerVisibleSelector = (state: State) =>
  state.settings.featureFlagsBannerVisible;
export const debugAppLevelDrawerOpenedSelector = (state: State) =>
  state.settings.debugAppLevelDrawerOpened;
export const hasBeenUpsoldProtectSelector = (state: State) => state.settings.hasBeenUpsoldProtect;
export const generalTermsVersionAcceptedSelector = (state: State) =>
  state.settings.generalTermsVersionAccepted;
export const userNpsSelector = (state: State) => state.settings.userNps;
export const getSupportedCounterValues = (state: State) => state.settings.supportedCounterValues;
