import type { Action } from "redux-actions";
import type {
  AccountComparator,
  AddAccountsProps,
  ImportAccountsReduceInput,
} from "@ledgerhq/live-common/account/index";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { Account, DeviceModelInfo } from "@ledgerhq/types-live";
import type { Payload as PostOnboardingPayload } from "@ledgerhq/live-common/postOnboarding/reducer";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import { ExchangeRate } from "@ledgerhq/live-common/exchange/swap/types";
import type {
  AccountsState,
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
}

export type AccountsImportStorePayload = { active: Account[] };
export type AccountsReorderPayload = { comparator: AccountComparator };
export type AccountsImportAccountsPayload = {
  input: ImportAccountsReduceInput;
};
export type AccountsReplaceAccountsPayload = Pick<
  AddAccountsProps,
  "scannedAccounts" | "selectedIds" | "renamings"
> &
  Partial<AddAccountsProps>;
export type AccountsSetAccountsPayload = AccountsState;
export type AccountsUpdateAccountWithUpdaterPayload = {
  accountId: string;
  updater: (arg0: Account) => Account;
};
export type AccountsDeleteAccountPayload = { account: Account };
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
  SYNC_IS_CONNECTED = "SYNC_IS_CONNECTED",
  HAS_CONNECTED_DEVICE = "HAS_CONNECTED_DEVICE",
  SET_MODAL_LOCK = "SET_MODAL_LOCK",
  QUEUE_BACKGROUND_EVENT = "QUEUE_BACKGROUND_EVENT",
  DEQUEUE_BACKGROUND_EVENT = "DEQUEUE_BACKGROUND_EVENT",
  CLEAR_BACKGROUND_EVENTS = "CLEAR_BACKGROUND_EVENTS",
}

export type AppStateIsConnectedPayload = Pick<AppState, "isConnected">;
export type AppStateSetHasConnectedDevicePayload = Pick<
  AppState,
  "hasConnectedDevice"
>;
export type AppStateSetModalLockPayload = Pick<AppState, "modalLock">;
export type AppStateAddBackgroundEventPayload = {
  event: FwUpdateBackgroundEvent;
};
export type AppStatePayload =
  | AppStateIsConnectedPayload
  | AppStateSetHasConnectedDevicePayload
  | AppStateSetModalLockPayload
  | AppStateAddBackgroundEventPayload;

// === BLE ACTIONS ===

export enum BleActionTypes {
  BLE_REMOVE_DEVICE = "BLE_REMOVE_DEVICE",
  BLE_REMOVE_DEVICES = "BLE_REMOVE_DEVICES",
  BLE_ADD_DEVICE = "BLE_ADD_DEVICE",
  BLE_IMPORT = "BLE_IMPORT",
  BLE_SAVE_DEVICE_NAME = "BLE_SAVE_DEVICE_NAME",
}

export type BleRemoveKnownDevicePayload = { deviceId: string };
export type BleRemoveKnownDevicesPayload = { ids: string[] };
export type BleAddKnownDevicePayload = { device: DeviceLike };
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
}

export type NotificationsSetModalOpenPayload = Pick<
  NotificationsState,
  "isPushNotificationsModalOpen"
>;

export type NotificationsSetModalLockedPayload = Pick<
  NotificationsState,
  "isPushNotificationsModalLocked"
>;

export type NotificationsSetModalTypePayload = Pick<
  NotificationsState,
  "notificationsModalType"
>;

export type NotificationsSetCurrentRouteNamePayload = Pick<
  NotificationsState,
  "currentRouteName"
>;

export type NotificationsSetEventTriggeredPayload = Pick<
  NotificationsState,
  "eventTriggered"
>;

export type NotificationsSetDataOfUserPayload = Pick<
  NotificationsState,
  "dataOfUser"
>;

export type NotificationsPayload =
  | NotificationsSetModalOpenPayload
  | NotificationsSetModalLockedPayload
  | NotificationsSetModalTypePayload
  | NotificationsSetCurrentRouteNamePayload
  | NotificationsSetEventTriggeredPayload
  | NotificationsSetDataOfUserPayload;

// === RATINGS ACTIONS ===

export enum RatingsActionTypes {
  RATINGS_SET_MODAL_OPEN = "RATINGS_SET_MODAL_OPEN",
  RATINGS_SET_MODAL_LOCKED = "RATINGS_SET_MODAL_LOCKED",
  RATINGS_SET_CURRENT_ROUTE_NAME = "RATINGS_SET_CURRENT_ROUTE_NAME",
  RATINGS_SET_HAPPY_MOMENT = "RATINGS_SET_HAPPY_MOMENT",
  RATINGS_SET_DATA_OF_USER = "RATINGS_SET_DATA_OF_USER",
}

export type RatingsSetModalOpenPayload = Pick<
  RatingsState,
  "isRatingsModalOpen"
>;
export type RatingsSetModalLockedPayload = Pick<
  RatingsState,
  "isRatingsModalLocked"
>;
export type RatingsSetCurrentRouteNamePayload = Pick<
  RatingsState,
  "currentRouteName"
>;
export type RatingsSetHappyMomentPayload = Pick<RatingsState, "happyMoment">;
export type RatingsDataOfUserPayload = Pick<RatingsState, "dataOfUser">;
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
  SETTINGS_INSTALL_APP_FIRST_TIME = "SETTINGS_INSTALL_APP_FIRST_TIME",
  SETTINGS_SET_READONLY_MODE = "SETTINGS_SET_READONLY_MODE",
  SETTINGS_SET_EXPERIMENTAL_USB_SUPPORT = "SETTINGS_SET_EXPERIMENTAL_USB_SUPPORT",
  SETTINGS_SWITCH_COUNTERVALUE_FIRST = "SETTINGS_SWITCH_COUNTERVALUE_FIRST",
  SETTINGS_HIDE_EMPTY_TOKEN_ACCOUNTS = "SETTINGS_HIDE_EMPTY_TOKEN_ACCOUNTS",
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
  SETTINGS_SET_DISCREET_MODE = "SETTINGS_SET_DISCREET_MODE",
  SETTINGS_SET_LANGUAGE = "SETTINGS_SET_LANGUAGE",
  SETTINGS_SET_LOCALE = "SETTINGS_SET_LOCALE",
  SET_SWAP_SELECTABLE_CURRENCIES = "SET_SWAP_SELECTABLE_CURRENCIES",
  SET_SWAP_KYC = "SET_SWAP_KYC",
  ACCEPT_SWAP_PROVIDER = "ACCEPT_SWAP_PROVIDER",
  LAST_SEEN_DEVICE = "LAST_SEEN_DEVICE",
  LAST_SEEN_DEVICE_INFO = "LAST_SEEN_DEVICE_INFO",
  ADD_STARRED_MARKET_COINS = "ADD_STARRED_MARKET_COINS",
  REMOVE_STARRED_MARKET_COINS = "REMOVE_STARRED_MARKET_COINS",
  SET_LAST_CONNECTED_DEVICE = "SET_LAST_CONNECTED_DEVICE",
  SET_HAS_ORDERED_NANO = "SET_HAS_ORDERED_NANO",
  SET_MARKET_REQUEST_PARAMS = "SET_MARKET_REQUEST_PARAMS",
  SET_MARKET_COUNTER_CURRENCY = "SET_MARKET_COUNTER_CURRENCY",
  SET_MARKET_FILTER_BY_STARRED_ACCOUNTS = "SET_MARKET_FILTER_BY_STARRED_ACCOUNTS",
  SET_SENSITIVE_ANALYTICS = "SET_SENSITIVE_ANALYTICS",
  SET_FIRST_CONNECTION_HAS_DEVICE = "SET_FIRST_CONNECTION_HAS_DEVICE",
  SET_NOTIFICATIONS = "SET_NOTIFICATIONS",
  RESET_SWAP_LOGIN_AND_KYC_DATA = "RESET_SWAP_LOGIN_AND_KYC_DATA",
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
export type SettingsSetPrivacyPayload = {
  privacy: Privacy;
};
export type SettingsSetPrivacyBiometricsPayload = {
  biometricsEnabled: boolean;
};
export type SettingsSetReportErrorsPayload = Pick<
  SettingsState,
  "reportErrorsEnabled"
>;

export type SettingsSetAnalyticsPayload = Pick<
  SettingsState,
  "analyticsEnabled"
>;
export type SettingsSetCountervaluePayload = Pick<
  SettingsState,
  "counterValue"
>;
export type SettingsSetOrderAccountsPayload = Pick<
  SettingsState,
  "orderAccounts"
>;
export type SettingsSetPairsPayload = { pairs: Array<Pair> };
export type SettingsSetSelectedTimeRangePayload = Pick<
  SettingsState,
  "selectedTimeRange"
>;
export type SettingsInstallAppFirstTimePayload = Pick<
  SettingsState,
  "hasInstalledAnyApp"
>;
export type SettingsSetReadOnlyModePayload = Pick<
  SettingsState,
  "readOnlyModeEnabled"
>;
export type SettingsSetExperimentalUsbSupportPayload = Pick<
  SettingsState,
  "experimentalUSBEnabled"
>;
export type SettingsHideEmptyTokenAccountsPayload = Pick<
  SettingsState,
  "hideEmptyTokenAccounts"
>;
export type SettingsShowTokenPayload = { tokenId: string };
export type SettingsBlacklistTokenPayload = { tokenId: string };
export type SettingsHideNftCollectionPayload = { collectionId: string };
export type SettingsUnhideNftCollectionPayload = { collectionId: string };
export type SettingsDismissBannerPayload = { bannerId: string };
export type SettingsSetAvailableUpdatePayload = Pick<
  SettingsState,
  "hasAvailableUpdate"
>;
export type SettingsSetThemePayload = Pick<SettingsState, "theme">;
export type SettingsSetOsThemePayload = Pick<SettingsState, "osTheme">;
export type SettingsSetCarouselVisibilityPayload = Pick<
  SettingsState,
  "carouselVisibility"
>;
export type SettingsSetDiscreetModePayload = Pick<
  SettingsState,
  "discreetMode"
>;
export type SettingsSetLanguagePayload = Pick<SettingsState, "language">;
export type SettingsSetLocalePayload = Pick<SettingsState, "locale">;
export type SettingsSetSwapSelectableCurrenciesPayload = Pick<
  SettingsState["swap"],
  "selectableCurrencies"
>;
export type SettingsSetSwapKycPayload = {
  provider?: string;
  id?: string;
  status?: string | null;
};
export type SettingsAcceptSwapProviderPayload = {
  acceptedProvider: Unpacked<SettingsState["swap"]["acceptedProviders"]>;
};
export type SettingsLastSeenDevicePayload = {
  deviceInfo: NonNullable<SettingsState["lastSeenDevice"]>["deviceInfo"];
};
export type SettingsLastSeenDeviceInfoPayload = {
  dmi: DeviceModelInfo;
};
export type SettingsAddStarredMarketcoinsPayload = {
  starredMarketCoin: Unpacked<SettingsState["starredMarketCoins"]>;
};
export type SettingsRemoveStarredMarketcoinsPayload = {
  starredMarketCoin: Unpacked<SettingsState["starredMarketCoins"]>;
};
export type SettingsSetLastConnectedDevicePayload = {
  lastConnectedDevice: Device;
};
export type SettingsSetHasOrderedNanoPayload = Pick<
  SettingsState,
  "hasOrderedNano"
>;
export type SettingsSetMarketRequestParamsPayload = Partial<
  Pick<SettingsState, "marketRequestParams">
>;
export type SettingsSetMarketCounterCurrencyPayload = Pick<
  SettingsState,
  "marketCounterCurrency"
>;
export type SettingsSetMarketFilterByStarredAccountsPayload = Pick<
  SettingsState,
  "marketFilterByStarredAccounts"
>;
export type SettingsSetSensitiveAnalyticsPayload = Pick<
  SettingsState,
  "sensitiveAnalytics"
>;
export type SettingsSetFirstConnectionHasDevicePayload = Pick<
  SettingsState,
  "firstConnectionHasDevice"
>;
export type SettingsSetNotificationsPayload = {
  notifications: Partial<SettingsState["notifications"]>;
};
export type SettingsDangerouslyOverrideStatePayload = State;
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
  | SettingsSetExperimentalUsbSupportPayload
  | SettingsHideEmptyTokenAccountsPayload
  | SettingsShowTokenPayload
  | SettingsBlacklistTokenPayload
  | SettingsHideNftCollectionPayload
  | SettingsUnhideNftCollectionPayload
  | SettingsDismissBannerPayload
  | SettingsSetAvailableUpdatePayload
  | SettingsSetThemePayload
  | SettingsSetOsThemePayload
  | SettingsSetCarouselVisibilityPayload
  | SettingsSetDiscreetModePayload
  | SettingsSetLanguagePayload
  | SettingsSetLocalePayload
  | SettingsSetSwapSelectableCurrenciesPayload
  | SettingsSetSwapKycPayload
  | SettingsAcceptSwapProviderPayload
  | SettingsLastSeenDevicePayload
  | SettingsLastSeenDeviceInfoPayload
  | SettingsAddStarredMarketcoinsPayload
  | SettingsRemoveStarredMarketcoinsPayload
  | SettingsSetLastConnectedDevicePayload
  | SettingsSetHasOrderedNanoPayload
  | SettingsSetMarketRequestParamsPayload
  | SettingsSetMarketCounterCurrencyPayload
  | SettingsSetMarketFilterByStarredAccountsPayload
  | SettingsSetSensitiveAnalyticsPayload
  | SettingsSetFirstConnectionHasDevicePayload
  | SettingsSetNotificationsPayload
  | SettingsDangerouslyOverrideStatePayload;

// === WALLET CONNECT ACTIONS ===

export enum WalletConnectActionTypes {
  WALLET_CONNECT_SET_URI = "WALLET_CONNECT_SET_URI",
}

export type WalletConnectSetUriPayload = Pick<WalletConnectState, "uri">;
export type WalletConnectPayload = WalletConnectSetUriPayload;

// === SWAP ACTIONS ==

export enum SwapActionTypes {
  UPDATE_PROVIDERS = "UPDATE_PROVIDERS",
  UPDATE_TRANSACTION = "UPDATE_TRANSACTION",
  UPDATE_RATE = "UPDATE_RATE",
}

export type UpdateProvidersPayload = SwapStateType["providers"];
export type UpdateTransactionPayload = Transaction | undefined;
export type UpdateRatePayload = ExchangeRate | undefined;

export type SwapPayload =
  | UpdateProvidersPayload
  | UpdateTransactionPayload
  | UpdateRatePayload;

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
  | Action<SwapPayload>;
