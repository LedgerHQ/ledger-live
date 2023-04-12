import type { Action } from "redux-actions";
import type {
  AccountComparator,
  AddAccountsProps,
  ImportAccountsReduceInput,
} from "@ledgerhq/live-common/account/index";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import type {
  Account,
  DeviceInfo,
  DeviceModelInfo,
  Feature,
  FeatureId,
} from "@ledgerhq/types-live";
import type { Payload as PostOnboardingPayload } from "@ledgerhq/live-common/postOnboarding/reducer";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import { ExchangeRate } from "@ledgerhq/live-common/exchange/swap/types";
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
  SwapStateType,
  DynamicContentState,
  ProtectState,
} from "../reducers/types";
import type { Unpacked } from "../types/helpers";

//  === ACCOUNTS ACTIONS ===

export enum AccountsActionTypes {
  ACCOUNTS_IMPORT = "ACCOUNTS_IMPORT",
  ACCOUNTS_USER_IMPORT = "ACCOUNTS_USER_IMPORT",
  REORDER_ACCOUNTS = "REORDER_ACCOUNTS",
  ACCOUNTS_ADD = "ACCOUNTS_ADD",
  SET_ACCOUNTS = "SET_ACCOUNTS",
  UPDATE_ACCOUNT = "UPDATE_ACCOUNT",
  DELETE_ACCOUNT = "DELETE_ACCOUNT",
  CLEAN_CACHE = "CLEAN_CACHE",
  DANGEROUSLY_OVERRIDE_STATE = "DANGEROUSLY_OVERRIDE_STATE",
}

export type AccountsImportStorePayload = Account[];
export type AccountsReorderPayload = AccountComparator;
export type AccountsImportAccountsPayload = ImportAccountsReduceInput;
export type AccountsReplaceAccountsPayload = Pick<
  AddAccountsProps,
  "scannedAccounts" | "selectedIds" | "renamings"
> &
  Partial<AddAccountsProps>;
export type AccountsSetAccountsPayload = Account[];
export type AccountsUpdateAccountWithUpdaterPayload = {
  accountId: string;
  updater: (arg0: Account) => Account;
};
export type AccountsDeleteAccountPayload = Account;
export type AccountsPayload =
  | AccountsImportStorePayload
  | AccountsReorderPayload
  | AccountsImportAccountsPayload
  | AccountsReplaceAccountsPayload
  | AccountsSetAccountsPayload
  | AccountsUpdateAccountWithUpdaterPayload
  | AccountsDeleteAccountPayload;

// === APPSTATE ACTIONS ===

export enum AppStateActionTypes {
  DEBUG_MENU_VISIBLE = "DEBUG_MENU_VISIBLE",
  SYNC_IS_CONNECTED = "SYNC_IS_CONNECTED",
  HAS_CONNECTED_DEVICE = "HAS_CONNECTED_DEVICE",
  SET_MODAL_LOCK = "SET_MODAL_LOCK",
  QUEUE_BACKGROUND_EVENT = "QUEUE_BACKGROUND_EVENT",
  DEQUEUE_BACKGROUND_EVENT = "DEQUEUE_BACKGROUND_EVENT",
  CLEAR_BACKGROUND_EVENTS = "CLEAR_BACKGROUND_EVENTS",
  DANGEROUSLY_OVERRIDE_STATE = "DANGEROUSLY_OVERRIDE_STATE",
  UPDATE_MAIN_NAVIGATOR_VISIBILITY = "UPDATE_MAIN_NAVIGATOR_VISIBILITY",
  SET_WIRED_DEVICE = "SET_WIRED_DEVICE",
}

export type AppStateIsConnectedPayload = AppState["isConnected"];
export type AppStateSetHasConnectedDevicePayload =
  AppState["hasConnectedDevice"];
export type AppStateSetWiredDevicePayload = AppState["wiredDevice"];
export type AppStateSetModalLockPayload = AppState["modalLock"];
export type AppStateAddBackgroundEventPayload = {
  event: FwUpdateBackgroundEvent;
};

export type AppStateUpdateMainNavigatorVisibilityPayload =
  AppState["isMainNavigatorVisible"];
export type AppStatePayload =
  | AppStateIsConnectedPayload
  | AppStateSetHasConnectedDevicePayload
  | AppStateSetModalLockPayload
  | AppStateAddBackgroundEventPayload
  | AppStateUpdateMainNavigatorVisibilityPayload;

// === BLE ACTIONS ===

export enum BleActionTypes {
  BLE_REMOVE_DEVICE = "BLE_REMOVE_DEVICE",
  BLE_REMOVE_DEVICES = "BLE_REMOVE_DEVICES",
  BLE_ADD_DEVICE = "BLE_ADD_DEVICE",
  BLE_IMPORT = "BLE_IMPORT",
  BLE_SAVE_DEVICE_NAME = "BLE_SAVE_DEVICE_NAME",
  DANGEROUSLY_OVERRIDE_STATE = "DANGEROUSLY_OVERRIDE_STATE",
}

export type BleRemoveKnownDevicePayload = string;
export type BleRemoveKnownDevicesPayload = string[];
export type BleAddKnownDevicePayload = DeviceLike;
export type BleImportBlePayload = BleState;
export type BleSaveDeviceNamePayload = { deviceId: string; name: string };
export type BlePayload =
  | BleRemoveKnownDevicePayload
  | BleRemoveKnownDevicesPayload
  | BleAddKnownDevicePayload
  | BleImportBlePayload
  | BleSaveDeviceNamePayload;

// === NOTIFICATIONS ACTIONS ===

export enum NotificationsActionTypes {
  NOTIFICATIONS_SET_MODAL_OPEN = "NOTIFICATIONS_SET_MODAL_OPEN",
  NOTIFICATIONS_SET_MODAL_LOCKED = "NOTIFICATIONS_SET_MODAL_LOCKED",
  NOTIFICATIONS_SET_MODAL_TYPE = "NOTIFICATIONS_SET_MODAL_TYPE",
  NOTIFICATIONS_SET_CURRENT_ROUTE_NAME = "NOTIFICATIONS_SET_CURRENT_ROUTE_NAME",
  NOTIFICATIONS_SET_EVENT_TRIGGERED = "NOTIFICATIONS_SET_EVENT_TRIGGERED",
  NOTIFICATIONS_SET_DATA_OF_USER = "NOTIFICATIONS_SET_DATA_OF_USER",
  DANGEROUSLY_OVERRIDE_STATE = "DANGEROUSLY_OVERRIDE_STATE",
}

export type NotificationsSetModalOpenPayload =
  NotificationsState["isPushNotificationsModalOpen"];

export type NotificationsSetModalLockedPayload =
  NotificationsState["isPushNotificationsModalLocked"];

export type NotificationsSetModalTypePayload =
  NotificationsState["notificationsModalType"];

export type NotificationsSetCurrentRouteNamePayload =
  NotificationsState["currentRouteName"];

export type NotificationsSetEventTriggeredPayload =
  NotificationsState["eventTriggered"];

export type NotificationsSetDataOfUserPayload =
  NotificationsState["dataOfUser"];

export type NotificationsPayload =
  | NotificationsSetModalOpenPayload
  | NotificationsSetModalLockedPayload
  | NotificationsSetModalTypePayload
  | NotificationsSetCurrentRouteNamePayload
  | NotificationsSetEventTriggeredPayload
  | NotificationsSetDataOfUserPayload;

// === DYNAMIC CONTENT ACTIONS ===

export enum DynamicContentActionTypes {
  DYNAMIC_CONTENT_SET_WALLET_CARDS = "DYNAMIC_CONTENT_SET_WALLET_CARDS",
  DYNAMIC_CONTENT_SET_ASSET_CARDS = "DYNAMIC_CONTENT_SET_ASSET_CARDS",
  DYNAMIC_CONTENT_SET_LEARN_CARDS = "DYNAMIC_CONTENT_SET_LEARN_CARDS",
  DYNAMIC_CONTENT_SET_NOTIFICATION_CARDS = "DYNAMIC_CONTENT_SET_NOTIFICATION_CARDS",
}

export type DynamicContentSetWalletCardsPayload =
  DynamicContentState["walletCards"];

export type DynamicContentSetAssetCardsPayload =
  DynamicContentState["assetsCards"];

export type DynamicContentSetLearnCardsPayload =
  DynamicContentState["learnCards"];

export type DynamicContentSetNotificationCardsPayload =
  DynamicContentState["notificationCards"];

export type DynamicContentPayload =
  | DynamicContentSetWalletCardsPayload
  | DynamicContentSetAssetCardsPayload
  | DynamicContentSetLearnCardsPayload
  | DynamicContentSetNotificationCardsPayload;

// === RATINGS ACTIONS ===

export enum RatingsActionTypes {
  RATINGS_SET_MODAL_OPEN = "RATINGS_SET_MODAL_OPEN",
  RATINGS_SET_MODAL_LOCKED = "RATINGS_SET_MODAL_LOCKED",
  RATINGS_SET_CURRENT_ROUTE_NAME = "RATINGS_SET_CURRENT_ROUTE_NAME",
  RATINGS_SET_HAPPY_MOMENT = "RATINGS_SET_HAPPY_MOMENT",
  RATINGS_SET_DATA_OF_USER = "RATINGS_SET_DATA_OF_USER",
  DANGEROUSLY_OVERRIDE_STATE = "DANGEROUSLY_OVERRIDE_STATE",
}

export type RatingsSetModalOpenPayload = RatingsState["isRatingsModalOpen"];
export type RatingsSetModalLockedPayload = RatingsState["isRatingsModalLocked"];
export type RatingsSetCurrentRouteNamePayload =
  RatingsState["currentRouteName"];
export type RatingsSetHappyMomentPayload = RatingsState["happyMoment"];
export type RatingsDataOfUserPayload = RatingsState["dataOfUser"];
export type RatingsPayload =
  | RatingsSetModalOpenPayload
  | RatingsSetModalLockedPayload
  | RatingsSetCurrentRouteNamePayload
  | RatingsSetHappyMomentPayload
  | RatingsDataOfUserPayload;

// === SETTINGS ACTIONS ===

export enum SettingsActionTypes {
  SETTINGS_IMPORT = "SETTINGS_IMPORT",
  SETTINGS_IMPORT_DESKTOP = "SETTINGS_IMPORT_DESKTOP",
  UPDATE_CURRENCY_SETTINGS = "UPDATE_CURRENCY_SETTINGS",
  SETTINGS_SET_PRIVACY = "SETTINGS_SET_PRIVACY",
  SETTINGS_SET_PRIVACY_BIOMETRICS = "SETTINGS_SET_PRIVACY_BIOMETRICS",
  SETTINGS_DISABLE_PRIVACY = "SETTINGS_DISABLE_PRIVACY",
  SETTINGS_SET_REPORT_ERRORS = "SETTINGS_SET_REPORT_ERRORS",
  SETTINGS_SET_ANALYTICS = "SETTINGS_SET_ANALYTICS",
  SETTINGS_SET_COUNTERVALUE = "SETTINGS_SET_COUNTERVALUE",
  SETTINGS_SET_ORDER_ACCOUNTS = "SETTINGS_SET_ORDER_ACCOUNTS",
  SETTINGS_SET_PAIRS = "SETTINGS_SET_PAIRS",
  SETTINGS_SET_SELECTED_TIME_RANGE = "SETTINGS_SET_SELECTED_TIME_RANGE",
  SETTINGS_COMPLETE_ONBOARDING = "SETTINGS_COMPLETE_ONBOARDING",
  SETTINGS_COMPLETE_CUSTOM_IMAGE_FLOW = "SETTINGS_COMPLETE_CUSTOM_IMAGE_FLOW",
  SETTINGS_INSTALL_APP_FIRST_TIME = "SETTINGS_INSTALL_APP_FIRST_TIME",
  SETTINGS_SET_READONLY_MODE = "SETTINGS_SET_READONLY_MODE",
  SETTINGS_SET_EXPERIMENTAL_USB_SUPPORT = "SETTINGS_SET_EXPERIMENTAL_USB_SUPPORT",
  SETTINGS_SWITCH_COUNTERVALUE_FIRST = "SETTINGS_SWITCH_COUNTERVALUE_FIRST",
  SETTINGS_HIDE_EMPTY_TOKEN_ACCOUNTS = "SETTINGS_HIDE_EMPTY_TOKEN_ACCOUNTS",
  SETTINGS_FILTER_TOKEN_OPERATIONS_ZERO_AMOUNT = "SETTINGS_FILTER_TOKEN_OPERATIONS_ZERO_AMOUNT",
  SHOW_TOKEN = "SHOW_TOKEN",
  BLACKLIST_TOKEN = "BLACKLIST_TOKEN",
  HIDE_NFT_COLLECTION = "HIDE_NFT_COLLECTION",
  UNHIDE_NFT_COLLECTION = "UNHIDE_NFT_COLLECTION",
  SETTINGS_DISMISS_BANNER = "SETTINGS_DISMISS_BANNER",
  SETTINGS_SET_AVAILABLE_UPDATE = "SETTINGS_SET_AVAILABLE_UPDATE",
  DANGEROUSLY_OVERRIDE_STATE = "DANGEROUSLY_OVERRIDE_STATE",
  SETTINGS_SET_THEME = "SETTINGS_SET_THEME",
  SETTINGS_SET_OS_THEME = "SETTINGS_SET_OS_THEME",
  SETTINGS_SET_CAROUSEL_VISIBILITY = "SETTINGS_SET_CAROUSEL_VISIBILITY",
  SETTINGS_SET_DISMISSED_DYNAMIC_CARDS = "SETTINGS_SET_DISMISSED_DYNAMIC_CARDS",
  SETTINGS_SET_DISCREET_MODE = "SETTINGS_SET_DISCREET_MODE",
  SETTINGS_SET_LANGUAGE = "SETTINGS_SET_LANGUAGE",
  SETTINGS_SET_LOCALE = "SETTINGS_SET_LOCALE",
  SETTINGS_SET_DATE_FORMAT = "SETTINGS_SET_DATE_FORMAT",
  SET_SWAP_SELECTABLE_CURRENCIES = "SET_SWAP_SELECTABLE_CURRENCIES",
  SET_SWAP_KYC = "SET_SWAP_KYC",
  ACCEPT_SWAP_PROVIDER = "ACCEPT_SWAP_PROVIDER",
  LAST_SEEN_DEVICE = "LAST_SEEN_DEVICE",
  LAST_SEEN_DEVICE_INFO = "LAST_SEEN_DEVICE_INFO",
  LAST_SEEN_DEVICE_LANGUAGE_ID = "LAST_SEEN_DEVICE_LANGUAGE_ID",
  SET_HAS_SEEN_STAX_ENABLED_NFTS_POPUP = "SET_HAS_SEEN_STAX_ENABLED_NFTS_POPUP",
  SET_LAST_SEEN_CUSTOM_IMAGE = "SET_LAST_SEEN_CUSTOM_IMAGE",
  ADD_STARRED_MARKET_COINS = "ADD_STARRED_MARKET_COINS",
  REMOVE_STARRED_MARKET_COINS = "REMOVE_STARRED_MARKET_COINS",
  SET_LAST_CONNECTED_DEVICE = "SET_LAST_CONNECTED_DEVICE",
  SET_CUSTOM_IMAGE_TYPE = "SET_CUSTOM_IMAGE_TYPE",
  SET_CUSTOM_IMAGE_BACKUP = "SET_CUSTOM_IMAGE_BACKUP",
  SET_HAS_ORDERED_NANO = "SET_HAS_ORDERED_NANO",
  SET_MARKET_REQUEST_PARAMS = "SET_MARKET_REQUEST_PARAMS",
  SET_MARKET_COUNTER_CURRENCY = "SET_MARKET_COUNTER_CURRENCY",
  SET_MARKET_FILTER_BY_STARRED_ACCOUNTS = "SET_MARKET_FILTER_BY_STARRED_ACCOUNTS",
  SET_SENSITIVE_ANALYTICS = "SET_SENSITIVE_ANALYTICS",
  SET_FIRST_CONNECTION_HAS_DEVICE = "SET_FIRST_CONNECTION_HAS_DEVICE",
  SET_NOTIFICATIONS = "SET_NOTIFICATIONS",
  RESET_SWAP_LOGIN_AND_KYC_DATA = "RESET_SWAP_LOGIN_AND_KYC_DATA",
  WALLET_TAB_NAVIGATOR_LAST_VISITED_TAB = "WALLET_TAB_NAVIGATOR_LAST_VISITED_TAB",
  SET_STATUS_CENTER = "SET_STATUS_CENTER",
  SET_OVERRIDDEN_FEATURE_FLAG = "SET_OVERRIDDEN_FEATURE_FLAG",
  SET_OVERRIDDEN_FEATURE_FLAGS = "SET_OVERRIDDEN_FEATURE_FLAGS",
  SET_FEATURE_FLAGS_BANNER_VISIBLE = "SET_FEATURE_FLAGS_BANNER_VISIBLE",
  SET_DEBUG_APP_LEVEL_DRAWER_OPENED = "SET_DEBUG_APP_LEVEL_DRAWER_OPENED",
  SET_HAS_BEEN_UPSOLD_PROTECT = "SET_HAS_BEEN_UPSOLD_PROTECT",
  SET_GENERAL_TERMS_VERSION_ACCEPTED = "SET_GENERAL_TERMS_VERSION_ACCEPTED",
}

export type SettingsImportPayload = Partial<SettingsState>;
export type SettingsImportDesktopPayload = {
  developerModeEnabled: boolean;
  currenciesSettings: SettingsState["currenciesSettings"];
} & Omit<Partial<SettingsState>, "currenciesSettings">;
export type SettingsUpdateCurrencyPayload = {
  ticker: string;
  patch: Partial<CurrencySettings>;
};
export type SettingsSetPrivacyPayload = Privacy;
export type SettingsSetPrivacyBiometricsPayload = boolean;
export type SettingsSetReportErrorsPayload =
  SettingsState["reportErrorsEnabled"];
export type SettingsSetAnalyticsPayload = SettingsState["analyticsEnabled"];
export type SettingsSetCountervaluePayload = SettingsState["counterValue"];
export type SettingsSetOrderAccountsPayload = SettingsState["orderAccounts"];
export type SettingsSetPairsPayload = { pairs: Array<Pair> };
export type SettingsSetSelectedTimeRangePayload =
  SettingsState["selectedTimeRange"];
export type SettingsInstallAppFirstTimePayload =
  SettingsState["hasInstalledAnyApp"];
export type SettingsSetReadOnlyModePayload =
  SettingsState["readOnlyModeEnabled"];
export type SettingsHideEmptyTokenAccountsPayload =
  SettingsState["hideEmptyTokenAccounts"];
export type SettingsFilterTokenOperationsZeroAmountPayload =
  SettingsState["filterTokenOperationsZeroAmount"];
export type SettingsShowTokenPayload = string;
export type SettingsBlacklistTokenPayload = string;
export type SettingsHideNftCollectionPayload = string;
export type SettingsUnhideNftCollectionPayload = string;
export type SettingsDismissBannerPayload = string;
export type SettingsSetAvailableUpdatePayload =
  SettingsState["hasAvailableUpdate"];
export type SettingsSetThemePayload = SettingsState["theme"];
export type SettingsSetOsThemePayload = SettingsState["osTheme"];
export type SettingsSetDismissedDynamicCardsPayload =
  SettingsState["dismissedDynamicCards"];
export type SettingsSetDiscreetModePayload = SettingsState["discreetMode"];
export type SettingsSetLanguagePayload = SettingsState["language"];
export type SettingsSetLocalePayload = SettingsState["locale"];
export type SettingsSetSwapSelectableCurrenciesPayload =
  SettingsState["swap"]["selectableCurrencies"];
export type SettingsSetSwapKycPayload = {
  provider?: string;
  id?: string;
  status?: string | null;
};
export type SettingsAcceptSwapProviderPayload = Unpacked<
  SettingsState["swap"]["acceptedProviders"]
>;
export type SettingsSetLastSeenCustomImagePayload = {
  imageSize: number;
  imageHash: string;
};
export type SettingsLastSeenDevicePayload = NonNullable<
  SettingsState["lastSeenDevice"]
>["deviceInfo"];
export type SettingsLastSeenDeviceInfoPayload = DeviceModelInfo;
export type SettingsLastSeenDeviceLanguagePayload = DeviceInfo["languageId"];
export type SettingsAddStarredMarketcoinsPayload = Unpacked<
  SettingsState["starredMarketCoins"]
>;
export type SettingsRemoveStarredMarketcoinsPayload = Unpacked<
  SettingsState["starredMarketCoins"]
>;
export type SettingsSetLastConnectedDevicePayload = Device;
export type SettingsSetHasSeenStaxEnabledNftsPopupPayload = Pick<
  SettingsState,
  "hasSeenStaxEnabledNftsPopup"
>;
export type SettingsSetCustomImageBackupPayload = {
  hex: string;
  hash: string;
};
export type SettingsSetCustomImageTypePayload = Pick<
  SettingsState,
  "customImageType"
>;
export type SettingsSetHasOrderedNanoPayload = SettingsState["hasOrderedNano"];
export type SettingsSetMarketRequestParamsPayload =
  SettingsState["marketRequestParams"];
export type SettingsSetMarketCounterCurrencyPayload =
  SettingsState["marketCounterCurrency"];
export type SettingsSetMarketFilterByStarredAccountsPayload =
  SettingsState["marketFilterByStarredAccounts"];
export type SettingsSetSensitiveAnalyticsPayload =
  SettingsState["sensitiveAnalytics"];
export type SettingsSetFirstConnectionHasDevicePayload =
  SettingsState["firstConnectionHasDevice"];
export type SettingsSetFirstConnectHasDeviceUpdatedPayload =
  SettingsState["firstConnectHasDeviceUpdated"];
export type SettingsSetNotificationsPayload = Partial<
  SettingsState["notifications"]
>;
export type SettingsSetWalletTabNavigatorLastVisitedTabPayload =
  SettingsState["walletTabNavigatorLastVisitedTab"];
export type SettingsSetDateFormatPayload = SettingsState["dateFormat"];
export type SettingsSetStatusCenterPayload =
  SettingsState["displayStatusCenter"];
export type SettingsDangerouslyOverrideStatePayload = State;
export type DangerouslyOverrideStatePayload = Partial<State>;
export type SettingsSetOverriddenFeatureFlagPlayload = {
  id: FeatureId;
  value: Feature | undefined;
};
export type SettingsSetOverriddenFeatureFlagsPlayload =
  SettingsState["overriddenFeatureFlags"];
export type SettingsSetFeatureFlagsBannerVisiblePayload =
  SettingsState["featureFlagsBannerVisible"];
export type SettingsSetDebugAppLevelDrawerOpenedPayload =
  SettingsState["debugAppLevelDrawerOpened"];

export type SettingsSetHasBeenUpsoldProtectPayload =
  SettingsState["hasBeenUpsoldProtect"];

export type SettingsCompleteOnboardingPayload =
  | void
  | SettingsState["hasCompletedOnboarding"];
export type SettingsSetGeneralTermsVersionAccepted =
  SettingsState["generalTermsVersionAccepted"];

export type SettingsPayload =
  | SettingsImportPayload
  | SettingsImportDesktopPayload
  | SettingsUpdateCurrencyPayload
  | SettingsSetPrivacyPayload
  | SettingsSetPrivacyBiometricsPayload
  | SettingsSetReportErrorsPayload
  | SettingsSetAnalyticsPayload
  | SettingsSetCountervaluePayload
  | SettingsSetOrderAccountsPayload
  | SettingsSetPairsPayload
  | SettingsSetSelectedTimeRangePayload
  | SettingsInstallAppFirstTimePayload
  | SettingsSetReadOnlyModePayload
  | SettingsHideEmptyTokenAccountsPayload
  | SettingsShowTokenPayload
  | SettingsBlacklistTokenPayload
  | SettingsHideNftCollectionPayload
  | SettingsUnhideNftCollectionPayload
  | SettingsDismissBannerPayload
  | SettingsSetAvailableUpdatePayload
  | SettingsSetThemePayload
  | SettingsSetOsThemePayload
  | SettingsSetDiscreetModePayload
  | SettingsSetLanguagePayload
  | SettingsSetLocalePayload
  | SettingsSetSwapSelectableCurrenciesPayload
  | SettingsSetSwapKycPayload
  | SettingsAcceptSwapProviderPayload
  | SettingsLastSeenDevicePayload
  | SettingsLastSeenDeviceLanguagePayload
  | SettingsLastSeenDeviceInfoPayload
  | SettingsSetLastSeenCustomImagePayload
  | SettingsAddStarredMarketcoinsPayload
  | SettingsRemoveStarredMarketcoinsPayload
  | SettingsSetLastConnectedDevicePayload
  | SettingsSetHasOrderedNanoPayload
  | SettingsSetMarketRequestParamsPayload
  | SettingsSetMarketCounterCurrencyPayload
  | SettingsSetMarketFilterByStarredAccountsPayload
  | SettingsSetSensitiveAnalyticsPayload
  | SettingsSetFirstConnectHasDeviceUpdatedPayload
  | SettingsSetNotificationsPayload
  | SettingsDangerouslyOverrideStatePayload
  | SettingsSetStatusCenterPayload
  | DangerouslyOverrideStatePayload
  | SettingsSetOverriddenFeatureFlagPlayload
  | SettingsSetOverriddenFeatureFlagsPlayload
  | SettingsSetFeatureFlagsBannerVisiblePayload
  | SettingsCompleteOnboardingPayload
  | SettingsSetDebugAppLevelDrawerOpenedPayload
  | SettingsSetGeneralTermsVersionAccepted
  | SettingsSetHasBeenUpsoldProtectPayload;

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

export type UpdateProvidersPayload = SwapStateType["providers"];
export type UpdateTransactionPayload = Transaction | undefined;
export type UpdateRatePayload = ExchangeRate | undefined;

export type SwapPayload =
  | UpdateProvidersPayload
  | UpdateTransactionPayload
  | UpdateRatePayload;

// === PROTECT ACTIONS ===
export enum ProtectActionTypes {
  UPDATE_DATA = "UPDATE_DATA",
  UPDATE_PROTECT_STATUS = "UPDATE_PROTECT_STATUS",
  RESET_STATE = "RESET_STATE",
}

export type ProtectDataPayload = ProtectState["data"];
export type ProtectStatusPayload = ProtectState["protectStatus"];
export type ProtectPayload = ProtectDataPayload | ProtectStatusPayload;

// === PAYLOADS ===

export type ActionsPayload =
  | Action<AccountsPayload>
  | Action<AppStatePayload>
  | Action<BlePayload>
  | Action<NotificationsPayload>
  | Action<RatingsPayload>
  | Action<SettingsPayload>
  | Action<WalletConnectPayload>
  | Action<PostOnboardingPayload>
  | Action<SwapPayload>
  | Action<ProtectPayload>;
