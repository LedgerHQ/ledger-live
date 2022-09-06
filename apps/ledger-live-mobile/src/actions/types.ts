import type {
  AccountComparator,
  AddAccountsProps,
  ImportAccountsReduceInput,
} from "@ledgerhq/live-common/lib/account/index";
import type { Account } from "@ledgerhq/types-live";
import type {
  AccountsState,
  AppState,
  BackgroundEvent,
  BleState,
  DeviceLike,
  NotificationsState,
  RatingsState,
} from "../reducers/types";

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

// PAYLOADS
export type AccountsImportStorePayload = AccountsState;
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
export type AccountsDeleteAccountPayload = Account;
export type AccountsPayload = AccountsImportStorePayload &
  AccountsReorderPayload &
  AccountsImportAccountsPayload &
  AccountsReplaceAccountsPayload &
  AccountsSetAccountsPayload &
  AccountsUpdateAccountWithUpdaterPayload &
  AccountsDeleteAccountPayload;

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
export type AppStateAddBackgroundEventPayload = { event: BackgroundEvent };
export type AppStatePayload = AppStateIsConnectedPayload &
  AppStateSetHasConnectedDevicePayload &
  AppStateSetModalLockPayload &
  AppStateAddBackgroundEventPayload;

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
export type BlePayload = BleRemoveKnownDevicePayload &
  BleRemoveKnownDevicesPayload &
  BleAddKnownDevicePayload &
  BleImportBlePayload &
  BleSaveDeviceNamePayload;

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
export type NotificationsPayload = NotificationsSetModalOpenPayload &
  NotificationsSetModalLockedPayload &
  NotificationsSetModalTypePayload &
  NotificationsSetCurrentRouteNamePayload &
  NotificationsSetEventTriggeredPayload &
  NotificationsSetDataOfUserPayload;

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
export type RatingsPayload = RatingsSetModalOpenPayload &
  RatingsSetModalLockedPayload &
  RatingsSetCurrentRouteNamePayload &
  RatingsSetHappyMomentPayload &
  RatingsDataOfUserPayload;

// === SETTINGS ACTIONS ===

export enum SettingsActionTypes {
  BLACKLIST_TOKEN = "BLACKLIST_TOKEN",
}

export type SettingsBlacklistTokenPayload = string;
