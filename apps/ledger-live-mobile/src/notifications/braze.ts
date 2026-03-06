import Braze from "@braze/react-native-sdk";
import { userIdSelector, isDummyUserId } from "@ledgerhq/client-ids/store";
import { store } from "../state-manager/configureStore";
import { NotificationsSettings } from "../reducers/types";
import { generateAnonymousId } from "@ledgerhq/live-common/braze/anonymousUsers";

export const start = (isTrackedUser: boolean) => {
  const state = store.getState();
  const userId = userIdSelector(state);
  if (!isDummyUserId(userId)) {
    Braze.changeUser(isTrackedUser ? userId.exportUserIdForBraze() : generateAnonymousId());
  }
};

export const updateUserPreferences = (notificationsPreferences: NotificationsSettings) => {
  const notificationsOptedIn = {
    optInAnnouncements: notificationsPreferences.announcementsCategory,
    optInLargeMovers: notificationsPreferences.largeMoverCategory,
    optInTxAlerts: notificationsPreferences.transactionsAlertsCategory,
    optInTotalMarketCap: notificationsPreferences.totalMarketCap,
    optInTopGainersLosers: notificationsPreferences.topGainersLosers,
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
