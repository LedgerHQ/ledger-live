import type { Action } from "redux-actions";
import type { AccountComparator } from "@ledgerhq/live-wallet/ordering";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type {
  Account,
  DeviceInfo,
  DeviceModelInfo,
  Feature,
  FeatureId,
} from "@ledgerhq/types-live";
import type { Payload as PostOnboardingPayload } from "@ledgerhq/live-common/postOnboarding/reducer";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import type {
  AppState,
  FwUpdateBackgroundEvent,
  BleState,
  CurrencySettings,
  DeviceLike,
  NotificationsState,
  Pair,
  Privacy,
  RatingsState,
  SettingsState,
  State,
  WalletConnectState,
  EarnState,
  DynamicContentState,
  ProtectState,
  MarketState,
  LargeMoverState,
  InViewState,
} from "../reducers/types";
import type { Unpacked } from "../types/helpers";
import type { HandlersPayloads } from "@ledgerhq/live-wallet/store";
import type { ImportAccountsReduceInput } from "@ledgerhq/live-wallet/liveqr/importAccounts";
import type { Steps } from "LLM/features/WalletSync/types/Activation";
import type { CounterValuesState } from "@ledgerhq/live-countervalues/types";
import type { UnknownAction } from "redux";

//  === ACCOUNTS ACTIONS ===

export enum AccountsActionTypes {
  ACCOUNTS_USER_IMPORT = "ACCOUNTS_USER_IMPORT",
  ADD_ACCOUNT = "ADD_ACCOUNT",
  REORDER_ACCOUNTS = "REORDER_ACCOUNTS",
  SET_ACCOUNTS = "SET_ACCOUNTS",
  UPDATE_ACCOUNT = "UPDATE_ACCOUNT",
  DELETE_ACCOUNT = "DELETE_ACCOUNT",
  CLEAN_CACHE = "CLEAN_CACHE",
  DANGEROUSLY_OVERRIDE_STATE = "DANGEROUSLY_OVERRIDE_STATE",
}

export type AccountsReorderPayload = AccountComparator;
export type AccountsImportAccountsPayload = ImportAccountsReduceInput;
export type AccountsUpdateAccountWithUpdaterPayload = {
  accountId: string;
  updater: (arg0: Account) => Account;
};
export type AccountsDeleteAccountPayload = Account;
export type AccountsReplacePayload = Account[];
export type AccountsPayload =
  | HandlersPayloads["INIT_ACCOUNTS"]
  | AccountsReorderPayload
  | AccountsImportAccountsPayload
  | AccountsUpdateAccountWithUpdaterPayload
  | AccountsDeleteAccountPayload
  | AccountsReplacePayload
  | Account;

// === APPSTATE ACTIONS ===

export enum AppStateActionTypes {
  DEBUG_MENU_VISIBLE = "DEBUG_MENU_VISIBLE",
  HAS_CONNECTED_DEVICE = "HAS_CONNECTED_DEVICE",
  SET_MODAL_LOCK = "SET_MODAL_LOCK",
  QUEUE_BACKGROUND_EVENT = "QUEUE_BACKGROUND_EVENT",
  DEQUEUE_BACKGROUND_EVENT = "DEQUEUE_BACKGROUND_EVENT",
  CLEAR_BACKGROUND_EVENTS = "CLEAR_BACKGROUND_EVENTS",
  DANGEROUSLY_OVERRIDE_STATE = "DANGEROUSLY_OVERRIDE_STATE",
  UPDATE_MAIN_NAVIGATOR_VISIBILITY = "UPDATE_MAIN_NAVIGATOR_VISIBILITY",
  SET_BLOCK_PASSWORD_LOCK = "SET_BLOCK_PASSWORD_LOCK",
  INCREMENT_REBOOT_ID = "INCREMENT_REBOOT_ID",
}

export type AppStateSetHasConnectedDevicePayload = AppState["hasConnectedDevice"];
export type AppStateSetModalLockPayload = AppState["modalLock"];
export type AppStateAddBackgroundEventPayload = {
  event: FwUpdateBackgroundEvent;
};
export type AppStateBlockPasswordLockPayload = boolean;

export type AppStateUpdateMainNavigatorVisibilityPayload = AppState["isMainNavigatorVisible"];
export type AppStatePayload =
  | AppStateSetHasConnectedDevicePayload
  | AppStateSetModalLockPayload
  | AppStateAddBackgroundEventPayload
  | AppStateUpdateMainNavigatorVisibilityPayload
  | AppStateBlockPasswordLockPayload;

// === BLE ACTIONS ===

export enum BleActionTypes {
  BLE_REMOVE_DEVICE = "BLE_REMOVE_DEVICE",
  BLE_REMOVE_DEVICES = "BLE_REMOVE_DEVICES",
  BLE_ADD_DEVICE = "BLE_ADD_DEVICE",
  BLE_UPDATE_DEVICE = "BLE_UPDATE_DEVICE",
  BLE_IMPORT = "BLE_IMPORT",
  BLE_SAVE_DEVICE_NAME = "BLE_SAVE_DEVICE_NAME",
  DANGEROUSLY_OVERRIDE_STATE = "DANGEROUSLY_OVERRIDE_STATE",
}

export type BleRemoveKnownDevicePayload = string;
export type BleRemoveKnownDevicesPayload = string[];
export type BleAddKnownDevicePayload = DeviceLike;
export type BleUpdateKnownDevicePayload = DeviceLike;
export type BleImportBlePayload = BleState;
export type BleSaveDeviceNamePayload = { deviceId: string; name: string };
export type BlePayload =
  | BleRemoveKnownDevicePayload
  | BleRemoveKnownDevicesPayload
  | BleAddKnownDevicePayload
  | BleUpdateKnownDevicePayload
  | BleImportBlePayload
  | BleSaveDeviceNamePayload;

// === COUNTERVALUES ACTIONS ===

export enum CountervaluesActionTypes {
  COUNTERVALUES_MARKETCAP_SET_IDS = "COUNTERVALUES_MARKETCAP_SET_IDS",
  COUNTERVALUES_MARKETCAP_SET_LOADING = "COUNTERVALUES_MARKETCAP_SET_LOADING",
  COUNTERVALUES_MARKETCAP_SET_ERROR = "COUNTERVALUES_MARKETCAP_SET_ERROR",
  COUNTERVALUES_POLLING_SET_IS_POLLING = "COUNTERVALUES_POLLING_SET_IS_POLLING",
  COUNTERVALUES_POLLING_SET_TRIGGER_LOAD = "COUNTERVALUES_POLLING_SET_TRIGGER_LOAD",
  COUNTERVALUES_STATE_SET = "COUNTERVALUES_STATE_SET",
  COUNTERVALUES_STATE_SET_PENDING = "COUNTERVALUES_STATE_PENDING_SET",
  COUNTERVALUES_STATE_SET_ERROR = "COUNTERVALUES_STATE_ERROR_SET",
  COUNTERVALUES_WIPE = "COUNTERVALUES_WIPE_STATE",
}

export type CountervaluesMarketcapFetchIdsPayload = void;
export type CountervaluesMarketcapSetIdsPayload = string[];
export type CountervaluesMarketcapSetLoadingPayload = boolean;
export type CountervaluesMarketcapSetErrorPayload = string | null;
export type CountervaluesPollingSetIsPollingPayload = boolean;
export type CountervaluesPollingSetTriggerLoadPayload = boolean;
export type CountervaluesStateSetPayload = CounterValuesState;
export type CountervaluesStateSetPendingPayload = boolean;
export type CountervaluesStateSetErrorPayload = Error;

export type CountervaluesPayload =
  | CountervaluesMarketcapFetchIdsPayload
  | CountervaluesMarketcapSetIdsPayload
  | CountervaluesMarketcapSetLoadingPayload
  | CountervaluesMarketcapSetErrorPayload
  | CountervaluesPollingSetIsPollingPayload
  | CountervaluesPollingSetTriggerLoadPayload
  | CountervaluesStateSetPayload
  | CountervaluesStateSetPendingPayload
  | CountervaluesStateSetErrorPayload;

// === NOTIFICATIONS ACTIONS ===

export enum NotificationsActionTypes {
  NOTIFICATIONS_SET_MODAL_OPEN = "NOTIFICATIONS_SET_MODAL_OPEN",
  NOTIFICATIONS_SET_DRAWER_SOURCE = "NOTIFICATIONS_SET_DRAWER_SOURCE",
  NOTIFICATIONS_SET_DATA_OF_USER = "NOTIFICATIONS_SET_DATA_OF_USER",
  DANGEROUSLY_OVERRIDE_STATE = "DANGEROUSLY_OVERRIDE_STATE",
  NOTIFICATIONS_SET_PERMISSION_STATUS = "NOTIFICATIONS_SET_PERMISSION_STATUS",
}

export type NotificationsSetModalOpenPayload = NotificationsState["isPushNotificationsModalOpen"];

export type NotificationsSetDrawerSourcePayload = NotificationsState["drawerSource"];

export type NotificationSetPermissionStatusPayload = NotificationsState["permissionStatus"];

export type NotificationsSetDataOfUserPayload = NotificationsState["dataOfUser"];

export type NotificationsPayload =
  | NotificationsSetModalOpenPayload
  | NotificationsSetDrawerSourcePayload
  | NotificationsSetDataOfUserPayload
  | NotificationSetPermissionStatusPayload;

// === DYNAMIC CONTENT ACTIONS ===

export enum DynamicContentActionTypes {
  DYNAMIC_CONTENT_SET_WALLET_CARDS = "DYNAMIC_CONTENT_SET_WALLET_CARDS",
  DYNAMIC_CONTENT_SET_ASSET_CARDS = "DYNAMIC_CONTENT_SET_ASSET_CARDS",
  DYNAMIC_CONTENT_SET_NOTIFICATION_CARDS = "DYNAMIC_CONTENT_SET_NOTIFICATION_CARDS",
  DYNAMIC_CONTENT_SET_CATEGORIES_CARDS = "DYNAMIC_CONTENT_SET_CATEGORIES_CARDS",
  DYNAMIC_CONTENT_SET_LANDING_STICKY_CTA_CARDS = "DYNAMIC_CONTENT_SET_LANDING_STICKY_CTA_CARDS",
  DYNAMIC_CONTENT_SET_MOBILE_CARDS = "DYNAMIC_CONTENT_SET_MOBILE_CARDS",
  DYNAMIC_CONTENT_IS_LOADING = "DYNAMIC_CONTENT_IS_LOADING",
  DYNAMIC_CONTENT_ADD_LOCAL_CARDS = "DYNAMIC_CONTENT_ADD_LOCAL_CARDS",
  DYNAMIC_CONTENT_CLEAR_LOCAL_CARDS = "DYNAMIC_CONTENT_CLEAR_LOCAL_CARDS",
  DYNAMIC_CONTENT_REMOVE_LOCAL_CARD = "DYNAMIC_CONTENT_REMOVE_LOCAL_CARD",
}

export type DynamicContentSetWalletCardsPayload = DynamicContentState["walletCards"];

export type DynamicContentSetAssetCardsPayload = DynamicContentState["assetsCards"];

export type DynamicContentSetNotificationCardsPayload = DynamicContentState["notificationCards"];

export type DynamicContentSetCategoriesCardsPayload = DynamicContentState["categoriesCards"];
export type DynamicContentSetLandingStickyCtaCardsPayload =
  DynamicContentState["landingPageStickyCtaCards"];

export type DynamicContentSetMobileCardsPayload = DynamicContentState["mobileCards"];

export type DynamicContentAddLocalCardsPayload = {
  category: import("../dynamicContent/types").CategoryContentCard;
  cards: import("../dynamicContent/types").BrazeContentCard[];
};

export type DynamicContentRemoveLocalCardPayload = string;

export type DynamicContentPayload =
  | DynamicContentSetWalletCardsPayload
  | DynamicContentSetAssetCardsPayload
  | DynamicContentSetNotificationCardsPayload
  | DynamicContentSetCategoriesCardsPayload
  | DynamicContentSetLandingStickyCtaCardsPayload
  | DynamicContentSetMobileCardsPayload
  | DynamicContentAddLocalCardsPayload
  | DynamicContentRemoveLocalCardPayload;

// === RATINGS ACTIONS ===

export enum RatingsActionTypes {
  RATINGS_SET_MODAL_OPEN = "RATINGS_SET_MODAL_OPEN",
  RATINGS_SET_CURRENT_ROUTE_NAME = "RATINGS_SET_CURRENT_ROUTE_NAME",
  RATINGS_SET_HAPPY_MOMENT = "RATINGS_SET_HAPPY_MOMENT",
  RATINGS_SET_DATA_OF_USER = "RATINGS_SET_DATA_OF_USER",
  DANGEROUSLY_OVERRIDE_STATE = "DANGEROUSLY_OVERRIDE_STATE",
}

export type RatingsSetModalOpenPayload = RatingsState["isRatingsModalOpen"];
export type RatingsSetCurrentRouteNamePayload = RatingsState["currentRouteName"];
export type RatingsSetHappyMomentPayload = RatingsState["happyMoment"];
export type RatingsDataOfUserPayload = RatingsState["dataOfUser"];
export type RatingsPayload =
  | RatingsSetModalOpenPayload
  | RatingsSetCurrentRouteNamePayload
  | RatingsSetHappyMomentPayload
  | RatingsDataOfUserPayload;

// === SETTINGS ACTIONS ===

export enum SettingsActionTypes {
  SETTINGS_IMPORT = "SETTINGS_IMPORT",
  UPDATE_CURRENCY_SETTINGS = "UPDATE_CURRENCY_SETTINGS",
  SETTINGS_SET_PRIVACY = "SETTINGS_SET_PRIVACY",
  SETTINGS_SET_PRIVACY_BIOMETRICS = "SETTINGS_SET_PRIVACY_BIOMETRICS",
  SETTINGS_DISABLE_PRIVACY = "SETTINGS_DISABLE_PRIVACY",
  SETTINGS_SET_REPORT_ERRORS = "SETTINGS_SET_REPORT_ERRORS",
  SETTINGS_SET_ANALYTICS = "SETTINGS_SET_ANALYTICS",
  SETTINGS_SET_PERSONALIZED_RECOMMENDATIONS = "SETTINGS_SET_PERSONALIZED_RECOMMENDATIONS",
  SETTINGS_SET_COUNTERVALUE = "SETTINGS_SET_COUNTERVALUE",
  SETTINGS_SET_ORDER_ACCOUNTS = "SETTINGS_SET_ORDER_ACCOUNTS",
  SETTINGS_SET_PAIRS = "SETTINGS_SET_PAIRS",
  SETTINGS_SET_SELECTED_TIME_RANGE = "SETTINGS_SET_SELECTED_TIME_RANGE",
  SETTINGS_COMPLETE_ONBOARDING = "SETTINGS_COMPLETE_ONBOARDING",
  SETTINGS_SET_IS_ONBOARDING_FlOW = "SETTINGS_SET_IS_ONBOARDING_FlOW",
  SETTINGS_SET_IS_ONBOARDING_FlOW_RECEIVE_SUCCESS = "SETTINGS_SET_IS_ONBOARDING_FlOW_RECEIVE_SUCCESS",
  SETTINGS_SET_IS_POST_ONBOARDING_FlOW = "SETTINGS_SET_IS_POST_ONBOARDING_FlOW",
  SETTINGS_COMPLETE_CUSTOM_IMAGE_FLOW = "SETTINGS_COMPLETE_CUSTOM_IMAGE_FLOW",
  SETTINGS_SET_HAS_INSTALLED_ANY_APP = "SETTINGS_SET_HAS_INSTALLED_ANY_APP",
  SETTINGS_SET_READONLY_MODE = "SETTINGS_SET_READONLY_MODE",
  SETTINGS_SWITCH_COUNTERVALUE_FIRST = "SETTINGS_SWITCH_COUNTERVALUE_FIRST",
  SETTINGS_HIDE_EMPTY_TOKEN_ACCOUNTS = "SETTINGS_HIDE_EMPTY_TOKEN_ACCOUNTS",
  SETTINGS_FILTER_TOKEN_OPERATIONS_ZERO_AMOUNT = "SETTINGS_FILTER_TOKEN_OPERATIONS_ZERO_AMOUNT",
  SHOW_TOKEN = "SHOW_TOKEN",
  BLACKLIST_TOKEN = "BLACKLIST_TOKEN",
  SETTINGS_DISMISS_BANNER = "SETTINGS_DISMISS_BANNER",
  DANGEROUSLY_OVERRIDE_STATE = "DANGEROUSLY_OVERRIDE_STATE",
  SETTINGS_SET_THEME = "SETTINGS_SET_THEME",
  SETTINGS_SET_OS_THEME = "SETTINGS_SET_OS_THEME",
  SETTINGS_SET_DISMISSED_DYNAMIC_CARDS = "SETTINGS_SET_DISMISSED_DYNAMIC_CARDS",
  SETTINGS_SET_DISCREET_MODE = "SETTINGS_SET_DISCREET_MODE",
  SETTINGS_SET_LANGUAGE = "SETTINGS_SET_LANGUAGE",
  SETTINGS_SET_LOCALE = "SETTINGS_SET_LOCALE",
  SETTINGS_SET_DATE_FORMAT = "SETTINGS_SET_DATE_FORMAT",
  LAST_SEEN_DEVICE_INFO = "LAST_SEEN_DEVICE_INFO",
  LAST_SEEN_DEVICE_LANGUAGE_ID = "LAST_SEEN_DEVICE_LANGUAGE_ID",
  SET_KNOWN_DEVICE_MODEL_IDS = "SET_KNOWN_DEVICE_MODEL_IDS",
  SET_LAST_SEEN_CUSTOM_IMAGE = "SET_LAST_SEEN_CUSTOM_IMAGE",
  SET_LAST_CONNECTED_DEVICE = "SET_LAST_CONNECTED_DEVICE",
  SET_CUSTOM_IMAGE_TYPE = "SET_CUSTOM_IMAGE_TYPE",
  SET_HAS_ORDERED_NANO = "SET_HAS_ORDERED_NANO",
  SET_SENSITIVE_ANALYTICS = "SET_SENSITIVE_ANALYTICS",
  SET_ONBOARDING_HAS_DEVICE = "SET_ONBOARDING_HAS_DEVICE",
  SET_IS_REBORN = "SET_IS_REBORN",
  SET_NOTIFICATIONS = "SET_NOTIFICATIONS",
  WALLET_TAB_NAVIGATOR_LAST_VISITED_TAB = "WALLET_TAB_NAVIGATOR_LAST_VISITED_TAB",
  SET_OVERRIDDEN_FEATURE_FLAG = "SET_OVERRIDDEN_FEATURE_FLAG",
  SET_OVERRIDDEN_FEATURE_FLAGS = "SET_OVERRIDDEN_FEATURE_FLAGS",
  SET_FEATURE_FLAGS_BANNER_VISIBLE = "SET_FEATURE_FLAGS_BANNER_VISIBLE",
  SET_DEBUG_APP_LEVEL_DRAWER_OPENED = "SET_DEBUG_APP_LEVEL_DRAWER_OPENED",
  /* NB: Protect is the former codename for Ledger Recover */
  SET_HAS_BEEN_UPSOLD_PROTECT = "SET_HAS_BEEN_UPSOLD_PROTECT",
  SET_HAS_BEEN_REDIRECTED_TO_POST_ONBOARDING = "SET_HAS_BEEN_REDIRECTED_TO_POST_ONBOARDING",
  SET_GENERAL_TERMS_VERSION_ACCEPTED = "SET_GENERAL_TERMS_VERSION_ACCEPTED",
  SET_ONBOARDING_TYPE = "SET_ONBOARDING_TYPE",
  SET_CLOSED_WITHDRAW_BANNER = "SET_CLOSED_WITHDRAW_BANNER",
  SET_USER_NPS = "SET_USER_NPS",
  SET_SUPPORTED_COUNTER_VALUES = "SET_SUPPORTED_COUNTER_VALUES",
  SET_HAS_SEEN_ANALYTICS_OPT_IN_PROMPT = "SET_HAS_SEEN_ANALYTICS_OPT_IN_PROMPT",
  SET_DISMISSED_CONTENT_CARD = "SET_DISMISSED_CONTENT_CARD",
  CLEAR_DISMISSED_CONTENT_CARDS = "CLEAR_DISMISSED_CONTENT_CARDS",
  SET_LEDGER_SYNC_ONBOARDING = "SET_LEDGER_SYNC_ONBOARDING",
  SET_MEV_PROTECTION = "SET_MEV_PROTECTION",
  SET_SELECTED_TAB_PORTFOLIO_ASSETS = "SET_SELECTED_TAB_PORTFOLIO_ASSETS",

  ADD_STARRED_MARKET_COINS = "ADD_STARRED_MARKET_COINS",
  REMOVE_STARRED_MARKET_COINS = "REMOVE_STARRED_MARKET_COINS",
  SET_HAS_SEEN_WALLET_V4_TOUR = "SET_HAS_SEEN_WALLET_V4_TOUR",
}

export type SettingsImportPayload = Partial<SettingsState>;
export type SettingsUpdateCurrencyPayload = {
  ticker: string;
  patch: Partial<CurrencySettings>;
};
export type SettingsSetPrivacyPayload = Privacy;
export type SettingsSetPrivacyBiometricsPayload = boolean;
export type SettingsSetReportErrorsPayload = SettingsState["reportErrorsEnabled"];
export type SettingsSetAnalyticsPayload = SettingsState["analyticsEnabled"];
export type SettingsSetPersonalizedRecommendationsPayload =
  SettingsState["personalizedRecommendationsEnabled"];
export type SettingsSetCountervaluePayload = SettingsState["counterValue"];
export type SettingsSetOrderAccountsPayload = SettingsState["orderAccounts"];
export type SettingsSetPairsPayload = { pairs: Array<Pair> };
export type SettingsSetSelectedTimeRangePayload = SettingsState["selectedTimeRange"];
export type SettingsSetHasInstalledAnyAppPayload = SettingsState["hasInstalledAnyApp"];
export type SettingsSetReadOnlyModePayload = SettingsState["readOnlyModeEnabled"];
export type SettingsHideEmptyTokenAccountsPayload = SettingsState["hideEmptyTokenAccounts"];
export type SettingsFilterTokenOperationsZeroAmountPayload =
  SettingsState["filterTokenOperationsZeroAmount"];
export type SettingsShowTokenPayload = string;
export type SettingsBlacklistTokenPayload = string;
export type SettingsDismissBannerPayload = string;
export type SettingsSetThemePayload = SettingsState["theme"];
export type SettingsSetOsThemePayload = SettingsState["osTheme"];
export type SettingsSetDismissedDynamicCardsPayload = SettingsState["dismissedDynamicCards"];
export type SettingsSetDiscreetModePayload = SettingsState["discreetMode"];
export type SettingsSetLanguagePayload = SettingsState["language"];
export type SettingsSetLocalePayload = SettingsState["locale"];
export type SettingsAcceptSwapProviderPayload = Unpacked<
  SettingsState["swap"]["acceptedProviders"]
>;
export type SettingsSetLastSeenCustomImagePayload = {
  imageSize: number;
  imageHash: string;
};
export type SettingsLastSeenDevicePayload = NonNullable<
  SettingsState["seenDevices"][number]
>["deviceInfo"];
export type SettingsLastSeenDeviceInfoPayload = DeviceModelInfo;
export type SettingsLastSeenDeviceLanguagePayload = DeviceInfo["languageId"];
export type SettingsSetKnownDeviceModelIdsPayload = { [key in DeviceModelId]?: boolean };
export type SettingsSetLastConnectedDevicePayload = Device;
export type SettingsSetCustomImageTypePayload = Pick<SettingsState, "customLockScreenType">;
export type SettingsSetHasOrderedNanoPayload = SettingsState["hasOrderedNano"];
export type SettingsSetSensitiveAnalyticsPayload = SettingsState["sensitiveAnalytics"];
export type SettingsSetOnboardingHasDevicePayload = SettingsState["onboardingHasDevice"];
export type SettingsSetIsRebornPayload = SettingsState["isReborn"];

export type SettingsSetOnboardingTypePayload = SettingsState["onboardingType"];

export type SettingsSetClosedWithdrawBannerPayload = boolean;

export type SettingsSetNotificationsPayload = Partial<SettingsState["notifications"]>;
export type SettingsSetWalletTabNavigatorLastVisitedTabPayload =
  SettingsState["walletTabNavigatorLastVisitedTab"];
export type SettingsSetDateFormatPayload = SettingsState["dateFormat"];
export type SettingsDangerouslyOverrideStatePayload = State;
export type DangerouslyOverrideStatePayload = Partial<State>;
export type SettingsSetOverriddenFeatureFlagPlayload = {
  id: FeatureId;
  value: Feature | undefined;
};
export type SettingsSetOverriddenFeatureFlagsPlayload = SettingsState["overriddenFeatureFlags"];
export type SettingsSetFeatureFlagsBannerVisiblePayload =
  SettingsState["featureFlagsBannerVisible"];
export type SettingsSetDebugAppLevelDrawerOpenedPayload =
  SettingsState["debugAppLevelDrawerOpened"];

export type SettingsSetHasBeenUpsoldProtectPayload = SettingsState["hasBeenUpsoldProtect"];
export type SettingsSetHasBeenRedirectedToPostOnboardingPayload =
  SettingsState["hasBeenRedirectedToPostOnboarding"];

export type SettingsCompleteOnboardingPayload = void | SettingsState["hasCompletedOnboarding"];
export type SettingsIsOnboardingFlowPayload = void | SettingsState["isOnboardingFlow"];
export type SettingsIsOnboardingFlowReceiveSuccessPayload =
  | void
  | SettingsState["isOnboardingFlowReceiveSuccess"];

export type SettingsIsPostOnboardingFlowPayload = void | SettingsState["isPostOnboardingFlow"];

export type SettingsSetGeneralTermsVersionAccepted = SettingsState["generalTermsVersionAccepted"];
export type SettingsSetUserNps = number;
export type SettingsSetSupportedCounterValues = SettingsState["supportedCounterValues"];
export type SettingsSetHasSeenAnalyticsOptInPrompt = SettingsState["hasSeenAnalyticsOptInPrompt"];
export type SettingsSetHasSeenWalletV4TourPayload = SettingsState["hasSeenWalletV4Tour"];
export type SettingsSetDismissedContentCardsPayload = SettingsState["dismissedContentCards"];
export type SettingsClearDismissedContentCardsPayload = string[];
export type SettingsSetFromLedgerSyncOnboardingPayload = boolean;
export type SettingsSetMevProtectionPayload = boolean;

export type SettingsAddStarredMarketcoinsPayload = Unpacked<SettingsState["starredMarketCoins"]>;
export type SettingsRemoveStarredMarketcoinsPayload = Unpacked<SettingsState["starredMarketCoins"]>;
export type SettingsSetSelectedTabPortfolioAssetsPayload =
  SettingsState["selectedTabPortfolioAssets"];

export type SettingsPayload =
  | SettingsImportPayload
  | SettingsUpdateCurrencyPayload
  | SettingsSetPrivacyPayload
  | SettingsSetPrivacyBiometricsPayload
  | SettingsSetReportErrorsPayload
  | SettingsSetAnalyticsPayload
  | SettingsSetPersonalizedRecommendationsPayload
  | SettingsSetCountervaluePayload
  | SettingsSetOrderAccountsPayload
  | SettingsSetPairsPayload
  | SettingsSetSelectedTimeRangePayload
  | SettingsSetHasInstalledAnyAppPayload
  | SettingsSetReadOnlyModePayload
  | SettingsHideEmptyTokenAccountsPayload
  | SettingsShowTokenPayload
  | SettingsBlacklistTokenPayload
  | SettingsDismissBannerPayload
  | SettingsSetThemePayload
  | SettingsSetOsThemePayload
  | SettingsSetDiscreetModePayload
  | SettingsSetLanguagePayload
  | SettingsSetLocalePayload
  | SettingsAcceptSwapProviderPayload
  | SettingsLastSeenDevicePayload
  | SettingsLastSeenDeviceLanguagePayload
  | SettingsLastSeenDeviceInfoPayload
  | SettingsSetLastSeenCustomImagePayload
  | SettingsSetLastConnectedDevicePayload
  | SettingsSetHasOrderedNanoPayload
  | SettingsSetSensitiveAnalyticsPayload
  | SettingsSetOnboardingHasDevicePayload
  | SettingsSetIsRebornPayload
  | SettingsSetNotificationsPayload
  | SettingsDangerouslyOverrideStatePayload
  | DangerouslyOverrideStatePayload
  | SettingsSetOverriddenFeatureFlagPlayload
  | SettingsSetOverriddenFeatureFlagsPlayload
  | SettingsSetFeatureFlagsBannerVisiblePayload
  | SettingsCompleteOnboardingPayload
  | SettingsIsOnboardingFlowPayload
  | SettingsIsOnboardingFlowReceiveSuccessPayload
  | SettingsIsPostOnboardingFlowPayload
  | SettingsSetDebugAppLevelDrawerOpenedPayload
  | SettingsSetGeneralTermsVersionAccepted
  | SettingsSetHasBeenUpsoldProtectPayload
  | SettingsSetOnboardingTypePayload
  | SettingsSetUserNps
  | SettingsSetSupportedCounterValues
  | SettingsSetHasSeenAnalyticsOptInPrompt
  | SettingsSetDismissedContentCardsPayload
  | SettingsClearDismissedContentCardsPayload
  | SettingsSetFromLedgerSyncOnboardingPayload
  | SettingsSetMevProtectionPayload
  | SettingsSetSelectedTabPortfolioAssetsPayload
  | SettingsAddStarredMarketcoinsPayload
  | SettingsRemoveStarredMarketcoinsPayload
  | SettingsSetHasSeenWalletV4TourPayload;

// === WALLET CONNECT ACTIONS ===
export enum WalletConnectActionTypes {
  WALLET_CONNECT_SET_URI = "WALLET_CONNECT_SET_URI",
}

export type WalletConnectSetUriPayload = WalletConnectState["uri"] | void;
export type WalletConnectPayload = WalletConnectSetUriPayload;

// === SWAP ACTIONS ==
export enum SwapActionTypes {
  UPDATE_PROVIDERS = "UPDATE_PROVIDERS",
  UPDATE_TRANSACTION = "UPDATE_TRANSACTION",
  UPDATE_RATE = "UPDATE_RATE",
  DANGEROUSLY_OVERRIDE_STATE = "DANGEROUSLY_OVERRIDE_STATE",
}

// === EARN ACTIONS ==
export enum EarnActionTypes {
  EARN_INFO_MODAL = "EARN_INFO_MODAL",
  EARN_MENU_MODAL = "EARN_MENU_MODAL",
  EARN_PROTOCOL_INFO_MODAL = "EARN_PROTOCOL_INFO_MODAL",
}

export type EarnSetInfoModalPayload = EarnState["infoModal"] | undefined;

export type EarnSetMenuModalPayload = EarnState["menuModal"] | undefined;

export type EarnSetProtocolInfoModalPayload = EarnState["protocolInfoModal"] | undefined;

export type EarnPayload =
  | EarnSetInfoModalPayload
  | EarnSetMenuModalPayload
  | EarnSetProtocolInfoModalPayload;

// === IN VIEW ACTIONS ===
export enum InViewActionTypes {
  IN_VIEW_SET_HAS_ITEMS = "IN_VIEW_SET_HAS_ITEMS",
}

export type InViewSetHasItemsPayload = InViewState["hasItems"];
export type InViewPayload = InViewSetHasItemsPayload;

// === PROTECT ACTIONS ===
export enum ProtectActionTypes {
  UPDATE_DATA = "UPDATE_DATA",
  UPDATE_PROTECT_STATUS = "UPDATE_PROTECT_STATUS",
  RESET_STATE = "RESET_STATE",
}

export type ProtectDataPayload = ProtectState["data"];
export type ProtectStatusPayload = ProtectState["protectStatus"];
export type ProtectPayload = ProtectDataPayload | ProtectStatusPayload;

// === MARKET ACTIONS ===
export enum MarketStateActionTypes {
  SET_MARKET_REQUEST_PARAMS = "SET_MARKET_REQUEST_PARAMS",
  SET_MARKET_FILTER_BY_STARRED_CURRENCIES = "SET_MARKET_FILTER_BY_STARRED_CURRENCIES",
  MARKET_SET_CURRENT_PAGE = "MARKET_SET_CURRENT_PAGE",
  MARKET_IMPORT = "MARKET_IMPORT",
}

export type MarketSetMarketFilterByStarredCurrenciesPayload =
  MarketState["marketFilterByStarredCurrencies"];
export type MarketSetCurrentPagePayload = MarketState["marketCurrentPage"];
export type MarketSetMarketRequestParamsPayload = MarketState["marketParams"];

export type MarketImportPayload = Partial<MarketState>;

export type MarketPayload =
  | MarketSetMarketFilterByStarredCurrenciesPayload
  | MarketSetMarketRequestParamsPayload
  | MarketSetCurrentPagePayload
  | MarketImportPayload;

// === LARGE MOVER ACTIONS ===
export enum LargeMoverActionTypes {
  SET_TUTORIAL = "LARGE_MOVER/SET_TUTORIAL",
  LARGE_MOVER_IMPORT = "LARGE_MOVER/IMPORT",
}
export type LargeMoverPayload = LargeMoverTutorialPayload | LargeMoverImportPayload;

export type LargeMoverImportPayload = Partial<LargeMoverState>;
export type LargeMoverTutorialPayload = LargeMoverState["tutorial"];

// === WALLETSYNC ACTIONS ===
export enum WalletSyncActionTypes {
  WALLET_SYNC_SET_MANAGE_KEY_DRAWER = "WALLET_SYNC_SET_MANAGE_KEY_DRAWER",
  LEDGER_SYNC_SET_ACTIVATE_DRAWER = "LEDGER_SYNC_SET_ACTIVATE_DRAWER",
  LEDGER_SYNC_SET_ACTIVATE_STEP = "LEDGER_SYNC_SET_ACTIVATE_STEP",
}

export type WalletSyncSetManageKeyDrawerPayload = boolean;
export type WalletSyncSetActivateDrawer = boolean;
export type WalletSyncSetActivateStep = Steps;
export type WalletSyncPayload =
  | WalletSyncSetManageKeyDrawerPayload
  | WalletSyncSetActivateDrawer
  | WalletSyncSetActivateStep;

// === AUTH ACTIONS ===
export enum AuthActionTypes {
  INITIALIZE_AUTH_STATE = "AUTH_INITIALIZE_AUTH_STATE",
  SET_LOCKED = "AUTH_SET_LOCKED",
  SET_BIOMETRICS_ERROR = "AUTH_SET_BIOMETRICS_ERROR",
  SET_AUTH_MODAL_OPEN = "AUTH_SET_AUTH_MODAL_OPEN",
  LOCK = "AUTH_LOCK",
  UNLOCK = "AUTH_UNLOCK",
}

export type AuthInitializeStatePayload = { privacy: Privacy | null | undefined };
export type AuthSetLockedPayload = boolean;
export type AuthSetBiometricsErrorPayload = Error | null;
export type AuthSetAuthModalOpenPayload = boolean;
export type AuthPayload =
  | AuthInitializeStatePayload
  | AuthSetLockedPayload
  | AuthSetBiometricsErrorPayload
  | AuthSetAuthModalOpenPayload;

// === PAYLOADS ===

export type ActionsPayload =
  | Action<AccountsPayload>
  | Action<AppStatePayload>
  | Action<AuthPayload>
  | Action<BlePayload>
  | Action<NotificationsPayload>
  | Action<RatingsPayload>
  | Action<SettingsPayload>
  | Action<WalletConnectPayload>
  | Action<PostOnboardingPayload>
  | Action<ProtectPayload>
  | Action<EarnPayload>
  | Action<MarketPayload>
  | UnknownAction;
