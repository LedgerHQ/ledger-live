import {
  backfillGlobalPushNotificationsDismissals,
  type NotificationPromptHistory,
} from "@domain/entity-notification-prompt";

type NotificationPromptStorage = {
  get<T>(key: string): Promise<T | null | undefined>;
  save<T>(key: string, value: T): Promise<unknown>;
};

const pushNotificationsDataOfUserStorageKey = "pushNotificationsDataOfUser";

export async function getPushNotificationsDataOfUserFromStorage(storage: NotificationPromptStorage) {
  const history = await storage.get<NotificationPromptHistory>(pushNotificationsDataOfUserStorageKey);

  if (!history || Array.isArray(history)) return null;

  const migratedHistory = backfillGlobalPushNotificationsDismissals(history);
  if (migratedHistory !== history) {
    await storage.save(pushNotificationsDataOfUserStorageKey, migratedHistory);
  }

  return migratedHistory;
}

export async function setPushNotificationsDataOfUserInStorage(
  storage: NotificationPromptStorage,
  history: NotificationPromptHistory,
) {
  return storage.save(pushNotificationsDataOfUserStorageKey, history);
}
