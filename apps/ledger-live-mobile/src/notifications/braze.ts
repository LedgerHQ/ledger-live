import Braze from "@braze/react-native-sdk";
import { NotificationsSettings } from "../reducers/types";
import { generateAnonymousId } from "@ledgerhq/live-common/braze/anonymousUsers";
import { getState } from "../context/store";
import { userIdSelector } from "../reducers/identities";

export const start = async (isTrackedUser: boolean) => {
  const state = getState();
  const userId = userIdSelector(state);
  Braze.changeUser(isTrackedUser ? userId.exportUserIdForBraze() : generateAnonymousId());
};

export const updateUserPreferences = (notificationsPreferences: NotificationsSettings) => {
  const notificationsOptedIn = {
    optInAnnouncements: notificationsPreferences.announcementsCategory,
    optInLargeMovers: notificationsPreferences.largeMoverCategory,
    optInTxAlerts: notificationsPreferences.transactionsAlertsCategory,
  };
  const notificationsBlacklisted = Object.entries(notificationsPreferences)
    .filter(([key, value]) => key !== "areNotificationsAllowed" && value === false)
    .map(([key]) => key);
  Braze.setCustomUserAttribute(
    "notificationsAllowed",
    notificationsPreferences.areNotificationsAllowed,
  );
  Braze.setCustomUserAttribute("notificationsBlacklisted", notificationsBlacklisted);
  for (const [key, value] of Object.entries(notificationsOptedIn)) {
    Braze.setCustomUserAttribute(key, value);
  }
};
