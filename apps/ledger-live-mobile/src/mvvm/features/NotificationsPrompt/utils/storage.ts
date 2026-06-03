import isEqual from "lodash/isEqual";
import storage from "LLM/storage";
import { backfillGlobalPushNotificationsDismissals } from "./backfillGlobalPushNotificationsDismissals";
import { type DataOfUser } from "../types";

const pushNotificationsDataOfUserStorageKey = "pushNotificationsDataOfUser";

export async function getPushNotificationsDataOfUserFromStorage() {
  const dataOfUser = await storage.get<DataOfUser>(pushNotificationsDataOfUserStorageKey);

  if (!dataOfUser || Array.isArray(dataOfUser)) return null;

  const migratedDataOfUser = backfillGlobalPushNotificationsDismissals(dataOfUser);
  if (!isEqual(migratedDataOfUser, dataOfUser)) {
    await storage.save(pushNotificationsDataOfUserStorageKey, migratedDataOfUser);
  }

  return migratedDataOfUser;
}

export async function setPushNotificationsDataOfUserInStorage(dataOfUser: DataOfUser) {
  return storage.save(pushNotificationsDataOfUserStorageKey, dataOfUser);
}
