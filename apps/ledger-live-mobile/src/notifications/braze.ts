import Braze from "@braze/react-native-sdk";
import getOrCreateUser from "../user";
import { NotificationsSettings } from "../reducers/types";

export const start = async () => {
  const { user } = await getOrCreateUser();
  Braze.changeUser(user.id);
};

export const updateUserPreferences = (notificationsPreferences: NotificationsSettings) => {
  const notificationsAllowed = notificationsPreferences.areNotificationsAllowed;
  const notificationsBlacklisted = Object.entries(notificationsPreferences)
    .filter(([key, value]) => key !== "areNotificationsAllowed" && value === false)
    .map(([key]) => key);
  Braze.setCustomUserAttribute("notificationsAllowed", notificationsAllowed);
  Braze.setCustomUserAttribute("notificationsBlacklisted", notificationsBlacklisted);
};
