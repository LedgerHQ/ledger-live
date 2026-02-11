import { handleActions, ReducerMap } from "redux-actions";
import type { Action } from "redux-actions";
import {
  getFiatCurrencyByTicker,
  findFiatCurrencyByTicker,
  findCryptoCurrencyByTicker,
} from "@ledgerhq/live-common/currencies/index";
import { getEnv } from "@ledgerhq/live-env";
import { createSelector } from "~/context/selectors";
import { getAccountCurrency } from "@ledgerhq/live-common/account/helpers";
import type { AccountLike, FeatureId } from "@ledgerhq/types-live";
import type { CryptoCurrency, Currency, Unit } from "@ledgerhq/types-cryptoassets";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { CurrencySettings, SettingsState, State, Theme } from "./types";
import { currencySettingsDefaults } from "../helpers/CurrencySettingsDefaults";
import { getDefaultLanguageLocale, getDefaultLocale } from "../languages";
import type {
  SettingsBlacklistTokenPayload,
  SettingsDismissBannerPayload,
  SettingsHideEmptyTokenAccountsPayload,
  SettingsFilterTokenOperationsZeroAmountPayload,
  SettingsImportPayload,
  SettingsSetHasInstalledAnyAppPayload,
  SettingsLastSeenDeviceInfoPayload,
  SettingsPayload,
  SettingsSetAnalyticsPayload,
  SettingsSetPersonalizedRecommendationsPayload,
  SettingsSetCountervaluePayload,
  SettingsSetDiscreetModePayload,
  SettingsSetHasOrderedNanoPayload,
  SettingsSetLanguagePayload,
  SettingsSetLastConnectedDevicePayload,
  SettingsSetLocalePayload,
  SettingsSetLastSeenCustomImagePayload,
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
  SettingsUpdateCurrencyPayload,
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
  SettingsSetCustomImageTypePayload,
  SettingsSetGeneralTermsVersionAccepted,
  SettingsSetOnboardingHasDevicePayload,
  SettingsSetOnboardingTypePayload,
  SettingsSetKnownDeviceModelIdsPayload,
  SettingsSetClosedWithdrawBannerPayload,
  SettingsSetUserNps,
  SettingsSetSupportedCounterValues,
  SettingsSetHasSeenAnalyticsOptInPrompt,
  SettingsSetDismissedContentCardsPayload,
  SettingsClearDismissedContentCardsPayload,
  SettingsAddStarredMarketcoinsPayload,
  SettingsRemoveStarredMarketcoinsPayload,
  SettingsSetFromLedgerSyncOnboardingPayload,
  SettingsSetHasBeenRedirectedToPostOnboardingPayload,
  SettingsSetMevProtectionPayload,
  SettingsSetSelectedTabPortfolioAssetsPayload,
  SettingsSetIsRebornPayload,
  SettingsIsOnboardingFlowPayload,
  SettingsIsOnboardingFlowReceiveSuccessPayload,
  SettingsIsPostOnboardingFlowPayload,
  SettingsSetHasSeenWalletV4TourPayload,
} from "../actions/types";
import {
  SettingsActionTypes,
  SettingsSetWalletTabNavigatorLastVisitedTabPayload,
} from "../actions/types";
import { ScreenName } from "~/const";
import { getFeature } from "@ledgerhq/live-common/featureFlags/firebaseFeatureFlags";

export const INITIAL_STATE: SettingsState = {
  counterValue: "USD",
  counterValueExchange: null,
  privacy: null,
  reportErrorsEnabled: true,
  analyticsEnabled: true,
  personalizedRecommendationsEnabled: true,
  currenciesSettings: {},
  pairExchanges: {},
  selectedTimeRange: "day",
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
  dismissedBanners: [],
  hasAvailableUpdate: false,
  theme: "system",
  osTheme: undefined,
  customLockScreenType: null,
  lastSeenCustomImage: {
    size: 0,
    hash: "",
  },
  dismissedDynamicCards: [],
  discreetMode: false,
  language: getDefaultLanguageLocale(),
  languageIsSetByUser: false,
  locale: getDefaultLocale(),
  swap: {
    hasAcceptedIPSharing: false,
    acceptedProviders: [],
    selectableCurrencies: [],
  },
  seenDevices: [],
  knownDeviceModelIds: {
    blue: false,
    nanoS: false,
    nanoSP: false,
    nanoX: false,
    stax: false,
    europa: false,
    apex: false,
  },
  lastConnectedDevice: null,
  sensitiveAnalytics: false,
  onboardingHasDevice: null,
  isReborn: null,
  notifications: {
    areNotificationsAllowed: true,
    announcementsCategory: true,
    largeMoverCategory: true,
    transactionsAlertsCategory: false,
  },
  neverClickedOnAllowNotificationsButton: true,
  walletTabNavigatorLastVisitedTab: ScreenName.Portfolio,
  overriddenFeatureFlags: {},
  featureFlagsBannerVisible: false,
  debugAppLevelDrawerOpened: false,
  dateFormat: "default",
  hasBeenUpsoldProtect: true, // will be set to false at the end of an onboarding, not false by default to avoid upsell for existing users
  hasBeenRedirectedToPostOnboarding: true, // will be set to false at the end of an onboarding, not false by default to avoid redirection for existing users
  onboardingType: null,
  depositFlow: {
    hasClosedWithdrawBanner: false,
  },
  userNps: null,
  supportedCounterValues: [],
  hasSeenAnalyticsOptInPrompt: false,
  dismissedContentCards: {},
  starredMarketCoins: [],
  fromLedgerSyncOnboarding: false,
  mevProtection: true,
  selectedTabPortfolioAssets: "Assets",
  isOnboardingFlow: false,
  isOnboardingFlowReceiveSuccess: false,
  isPostOnboardingFlow: false,
  generalTermsVersionAccepted: undefined,
  hasSeenWalletV4Tour: false,
};

const pairHash = (from: { ticker: string }, to: { ticker: string }) =>
  `${from.ticker}_${to.ticker}`;

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

const LWM_WALLET_40: FeatureId = "lwmWallet40";

const handlers: ReducerMap<SettingsState, SettingsPayload> = {
  [SettingsActionTypes.SETTINGS_IMPORT]: (state, action) => {
    const payload = (action as Action<SettingsImportPayload>).payload;
    const filteredPayload = filterValidSettings(payload);
    const wallet40FF = getFeature({
      key: LWM_WALLET_40,
      localOverrides: filteredPayload.overriddenFeatureFlags,
    });
    const isWallet40Enabled = wallet40FF?.enabled === true;
    const isWallet40GraphReworkEnabled =
      wallet40FF?.params?.graphRework === true && isWallet40Enabled;
    return {
      ...state,
      ...filteredPayload,
      locale: filteredPayload.locale ?? state.locale ?? getDefaultLocale(),
      ...(isWallet40GraphReworkEnabled && { selectedTimeRange: "day" }),
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

  [SettingsActionTypes.SETTINGS_SET_PERSONALIZED_RECOMMENDATIONS]: (state, action) => ({
    ...state,
    personalizedRecommendationsEnabled: (
      action as Action<SettingsSetPersonalizedRecommendationsPayload>
    ).payload,
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

  [SettingsActionTypes.SETTINGS_SET_IS_ONBOARDING_FlOW]: (state, action) => {
    const payload = (action as Action<SettingsIsOnboardingFlowPayload>).payload;
    return {
      ...state,
      isOnboardingFlow: !!payload,
    };
  },

  [SettingsActionTypes.SETTINGS_SET_IS_ONBOARDING_FlOW_RECEIVE_SUCCESS]: (state, action) => {
    const payload = (action as Action<SettingsIsOnboardingFlowReceiveSuccessPayload>).payload;
    return {
      ...state,
      isOnboardingFlowReceiveSuccess: !!payload,
    };
  },

  [SettingsActionTypes.SETTINGS_SET_IS_POST_ONBOARDING_FlOW]: (state, action) => {
    const payload = (action as Action<SettingsIsPostOnboardingFlowPayload>).payload;
    return {
      ...state,
      isPostOnboardingFlow: !!payload,
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

  [SettingsActionTypes.SETTINGS_DISMISS_BANNER]: (state, action) => ({
    ...state,
    dismissedBanners: [
      ...state.dismissedBanners,
      (action as Action<SettingsDismissBannerPayload>).payload,
    ],
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

  [SettingsActionTypes.LAST_SEEN_DEVICE_INFO]: (state, action) => {
    const { payload } = action as Action<SettingsLastSeenDeviceInfoPayload>;
    return {
      ...state,
      seenDevices: state.seenDevices
        .filter(d => d.modelId !== payload.modelId)
        .concat({ ...state.seenDevices.at(-1), ...payload }),
      knownDeviceModelIds: {
        ...state.knownDeviceModelIds,
        [payload.modelId]: true,
      },
    };
  },

  [SettingsActionTypes.SET_KNOWN_DEVICE_MODEL_IDS]: (state, action) => ({
    ...state,
    knownDeviceModelIds: {
      ...state.knownDeviceModelIds,
      ...(action as Action<SettingsSetKnownDeviceModelIdsPayload>).payload,
    },
  }),

  [SettingsActionTypes.SET_CUSTOM_IMAGE_TYPE]: (state, action) => ({
    ...state,
    customLockScreenType: (action as Action<SettingsSetCustomImageTypePayload>).payload
      .customLockScreenType,
  }),

  [SettingsActionTypes.LAST_SEEN_DEVICE_LANGUAGE_ID]: (state, action) => {
    const lastSeenDevice = state.seenDevices.at(-1);
    if (!lastSeenDevice) return state;
    const payload = (action as Action<SettingsLastSeenDeviceLanguagePayload>).payload;
    return {
      ...state,
      seenDevices: state.seenDevices.slice(0, -1).concat({
        ...lastSeenDevice,
        deviceInfo: { ...lastSeenDevice.deviceInfo, languageId: payload },
      }),
    };
  },

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

  [SettingsActionTypes.SET_SENSITIVE_ANALYTICS]: (state, action) => ({
    ...state,
    sensitiveAnalytics: (action as Action<SettingsSetSensitiveAnalyticsPayload>).payload,
  }),

  [SettingsActionTypes.SET_ONBOARDING_HAS_DEVICE]: (state, action) => ({
    ...state,
    onboardingHasDevice: (action as Action<SettingsSetOnboardingHasDevicePayload>).payload,
  }),

  [SettingsActionTypes.SET_IS_REBORN]: (state, action) => ({
    ...state,
    isReborn: (action as Action<SettingsSetIsRebornPayload>).payload,
  }),

  [SettingsActionTypes.SET_ONBOARDING_TYPE]: (state, action) => ({
    ...state,
    onboardingType: (action as Action<SettingsSetOnboardingTypePayload>).payload,
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
  [SettingsActionTypes.SET_HAS_BEEN_REDIRECTED_TO_POST_ONBOARDING]: (state, action) => ({
    ...state,
    hasBeenRedirectedToPostOnboarding: (
      action as Action<SettingsSetHasBeenRedirectedToPostOnboardingPayload>
    ).payload,
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
  [SettingsActionTypes.SET_HAS_SEEN_ANALYTICS_OPT_IN_PROMPT]: (state, action) => ({
    ...state,
    hasSeenAnalyticsOptInPrompt: (action as Action<SettingsSetHasSeenAnalyticsOptInPrompt>).payload,
  }),
  [SettingsActionTypes.SET_DISMISSED_CONTENT_CARD]: (state, action) => ({
    ...state,
    dismissedContentCards: {
      ...state.dismissedContentCards,
      ...(action as Action<SettingsSetDismissedContentCardsPayload>).payload,
    },
  }),
  [SettingsActionTypes.CLEAR_DISMISSED_CONTENT_CARDS]: (state, action) => {
    const { payload } = action as Action<SettingsClearDismissedContentCardsPayload>;
    const currentDismissedContentCards = state.dismissedContentCards || {};
    const entries = Object.entries(currentDismissedContentCards);
    const filteredEntries = entries.filter(([key]) => !payload?.includes(key));
    const dismissedContentCards = filteredEntries.reduce(
      (obj, [key, value]) => ({ ...obj, [key]: value }),
      {},
    );

    return {
      ...state,
      dismissedContentCards,
    };
  },

  [SettingsActionTypes.SET_LEDGER_SYNC_ONBOARDING]: (state, action) => ({
    ...state,
    fromLedgerSyncOnboarding: (action as Action<SettingsSetFromLedgerSyncOnboardingPayload>)
      .payload,
  }),

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

  [SettingsActionTypes.SET_MEV_PROTECTION]: (state, action) => ({
    ...state,
    mevProtection: (action as Action<SettingsSetMevProtectionPayload>).payload,
  }),

  [SettingsActionTypes.SET_SELECTED_TAB_PORTFOLIO_ASSETS]: (state, action) => ({
    ...state,
    selectedTabPortfolioAssets: (action as Action<SettingsSetSelectedTabPortfolioAssetsPayload>)
      .payload,
  }),

  [SettingsActionTypes.SET_HAS_SEEN_WALLET_V4_TOUR]: (state, action) => ({
    ...state,
    hasSeenWalletV4Tour: (action as Action<SettingsSetHasSeenWalletV4TourPayload>).payload,
  }),
};

export default handleActions<SettingsState, SettingsPayload>(handlers, INITIAL_STATE);

export const settingsStoreSelector = (state: State): SettingsState => state.settings;

const counterValueCurrencyLocalSelector = (state: SettingsState): Currency =>
  findFiatCurrencyByTicker(state.counterValue) ||
  findCryptoCurrencyByTicker(state.counterValue) ||
  getFiatCurrencyByTicker("USD");

export const counterValueCurrencySelector = createSelector(
  settingsStoreSelector,
  counterValueCurrencyLocalSelector,
);

const defaultCurrencySettingsForCurrency: (_: Currency) => CurrencySettings = crypto => {
  const defaults = currencySettingsDefaults(crypto);
  return {
    confirmationsNb: defaults.confirmationsNb ? defaults.confirmationsNb.def : 0,
    unit: defaults.unit,
  };
};
export const currencySettingsSelector = (
  state: SettingsState,
  {
    currency,
  }: {
    currency: Currency;
  },
) => {
  const currencySettings = Object.keys(state.currenciesSettings)?.includes(currency.ticker)
    ? state.currenciesSettings[currency.ticker]
    : {};

  return {
    ...defaultCurrencySettingsForCurrency(currency),
    ...currencySettings,
  };
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

export const privacySelector = createSelector(settingsStoreSelector, s => s.privacy);
export const reportErrorsEnabledSelector = createSelector(
  settingsStoreSelector,
  s => s.reportErrorsEnabled,
);
export const analyticsEnabledSelector = createSelector(
  settingsStoreSelector,
  s => s.analyticsEnabled,
);
export const personalizedRecommendationsEnabledSelector = createSelector(
  settingsStoreSelector,
  s => s.personalizedRecommendationsEnabled,
);
export const trackingEnabledSelector = createSelector(
  settingsStoreSelector,
  s => s.analyticsEnabled || s.personalizedRecommendationsEnabled,
);
export const lastSeenCustomImageSelector = createSelector(
  settingsStoreSelector,
  s => s.lastSeenCustomImage,
);
export const currencySettingsForAccountSelector = (
  s: SettingsState,
  {
    account,
  }: {
    account: AccountLike;
  },
) =>
  currencySettingsSelector(s, {
    currency: getAccountCurrency(account),
  });

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
export const isOnboardingFlowSelector = (state: State) => state.settings.isOnboardingFlow;
export const isOnboardingFlowReceiveSuccessSelector = (state: State) =>
  state.settings.isOnboardingFlowReceiveSuccess;
export const isPostOnboardingFlowSelector = (state: State) => state.settings.isPostOnboardingFlow;
export const hasInstalledAnyAppSelector = (state: State) => state.settings.hasInstalledAnyApp;
export const countervalueFirstSelector = (state: State) => state.settings.graphCountervalueFirst;
export const readOnlyModeEnabledSelector = (state: State) => state.settings.readOnlyModeEnabled;
export const blacklistedTokenIdsSelector = (state: State) => state.settings.blacklistedTokenIds;
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

/**
 * Selector that computes the resolved theme based on user preference and OS theme.
 * If theme is "system", it returns the OS theme (defaulting to "dark" if not available).
 * Otherwise, it returns the user's explicit theme choice.
 */
export const resolvedThemeSelector = createSelector(
  themeSelector,
  osThemeSelector,
  (theme: Theme, osTheme: SettingsState["osTheme"]): "light" | "dark" => {
    if (theme === "system") {
      return osTheme === "light" ? "light" : "dark";
    }
    return theme === "light" ? "light" : "dark";
  },
);
export const languageSelector = (state: State) =>
  state.settings.language || getDefaultLanguageLocale();
export const languageIsSetByUserSelector = (state: State) => state.settings.languageIsSetByUser;
export const localeSelector = (state: State) => state.settings.locale || getDefaultLocale();
export const swapSelectableCurrenciesSelector = (state: State) =>
  state.settings.swap.selectableCurrencies;
export const knownDeviceModelIdsSelector = (state: State) => state.settings.knownDeviceModelIds;
export const customImageTypeSelector = (state: State) => state.settings.customLockScreenType;

export const seenDevicesSelector = (state: State) => state.settings.seenDevices;
export const lastSeenDeviceSelector = (state: State) => {
  const lastSeenDevice = state.settings.seenDevices.at(-1);
  if (!lastSeenDevice || !Object.values(DeviceModelId).includes(lastSeenDevice?.modelId))
    return null;
  return lastSeenDevice;
};

export const lastConnectedDeviceSelector = (state: State) => {
  const { lastConnectedDevice } = state.settings;
  if (!lastConnectedDevice || !Object.values(DeviceModelId).includes(lastConnectedDevice?.modelId))
    return null;
  return lastConnectedDevice;
};

export const hasOrderedNanoSelector = (state: State) => state.settings.hasOrderedNano;
export const sensitiveAnalyticsSelector = (state: State) => state.settings.sensitiveAnalytics;
export const onboardingHasDeviceSelector = (state: State) => state.settings.onboardingHasDevice;
export const isRebornSelector = (state: State) => state.settings.isReborn;
export const onboardingTypeSelector = (state: State) => state.settings.onboardingType;
export const hasClosedWithdrawBannerSelector = (state: State) =>
  state.settings.depositFlow.hasClosedWithdrawBanner;
export const notificationsSelector = (state: State) => state.settings.notifications;
export const walletTabNavigatorLastVisitedTabSelector = (state: State) =>
  state.settings.walletTabNavigatorLastVisitedTab;
export const dateFormatSelector = (state: State) => state.settings.dateFormat;
export const overriddenFeatureFlagsSelector = (state: State) =>
  state.settings.overriddenFeatureFlags;
export const featureFlagsBannerVisibleSelector = (state: State) =>
  state.settings.featureFlagsBannerVisible;
export const debugAppLevelDrawerOpenedSelector = (state: State) =>
  state.settings.debugAppLevelDrawerOpened;
/* NB: Protect is the former codename for Ledger Recover */
export const hasBeenUpsoldProtectSelector = (state: State) => state.settings.hasBeenUpsoldProtect;
export const hasBeenRedirectedToPostOnboardingSelector = (state: State) =>
  state.settings.hasBeenRedirectedToPostOnboarding;
export const generalTermsVersionAcceptedSelector = (state: State) =>
  state.settings.generalTermsVersionAccepted;
export const userNpsSelector = (state: State) => state.settings.userNps;
export const supportedCounterValuesSelector = (state: State) =>
  state.settings.supportedCounterValues;
export const hasSeenAnalyticsOptInPromptSelector = (state: State) =>
  state.settings.hasSeenAnalyticsOptInPrompt;
export const dismissedContentCardsSelector = (state: State) => state.settings.dismissedContentCards;
export const isFromLedgerSyncOnboardingSelector = (state: State) =>
  state.settings.fromLedgerSyncOnboarding;

export const starredMarketCoinsSelector = (state: State) => state.settings.starredMarketCoins;

export const mevProtectionSelector = (state: State) => state.settings.mevProtection;
export const selectedTabPortfolioAssetsSelector = (state: State) =>
  state.settings.selectedTabPortfolioAssets;
export const hasSeenWalletV4TourSelector = (state: State) => state.settings.hasSeenWalletV4Tour;
