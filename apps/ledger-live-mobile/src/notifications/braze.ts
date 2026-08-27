import Braze from "@braze/react-native-sdk";
import { type UserId, isDummyUserId } from "@domain/entity-client-identity";
import { NotificationsSettings } from "../reducers/types";

export type StartBrazeOptions = {
  brazeOptOutIdentityCleanup?: boolean;
};

export const start = (isTrackedUser: boolean, userId: UserId, _options: StartBrazeOptions = {}) => {
  if (isDummyUserId(userId)) return;

  if (isTrackedUser) {
    Braze.changeUser(userId.exportUserIdForBraze());
  }
};

export type UpdateUserPreferencesOptions = {
  brazeOptOutIdentityCleanup?: boolean;
};

export const updateUserPreferences = (
  notificationsPreferences: NotificationsSettings,
  isTrackedUser: boolean,
  { brazeOptOutIdentityCleanup = false }: UpdateUserPreferencesOptions = {},
) => {
  // Legacy (flag off): still write prefs for opted-out users (anonymous Braze profile).
  // Flag on: never write Braze custom attributes without tracking consent.
  if (brazeOptOutIdentityCleanup && !isTrackedUser) return;

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
