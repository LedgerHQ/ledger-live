import storage from "LLM/storage";
import { type DataOfUser } from "../types";

const pushNotificationsDataOfUserStorageKey = "pushNotificationsDataOfUser";

export async function getPushNotificationsDataOfUserFromStorage() {
  const dataOfUser = await storage.get<DataOfUser>(pushNotificationsDataOfUserStorageKey);

  if (!dataOfUser || Array.isArray(dataOfUser)) return null;

  return dataOfUser;
}

export async function setPushNotificationsDataOfUserInStorage(dataOfUser: DataOfUser) {
  return storage.save(pushNotificationsDataOfUserStorageKey, dataOfUser);
}
