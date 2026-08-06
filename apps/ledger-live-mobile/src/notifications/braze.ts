import Braze from "@braze/react-native-sdk";
import { type UserId, isDummyUserId } from "@domain/entity-client-identity";
import { NotificationsSettings } from "../reducers/types";
import { generateAnonymousId } from "@ledgerhq/live-common/braze/anonymousUsers";

export type StartBrazeOptions = {
  brazeOptOutIdentityCleanup?: boolean;
};

export const start = (
  isTrackedUser: boolean,
  userId: UserId,
  { brazeOptOutIdentityCleanup = false }: StartBrazeOptions = {},
) => {
  if (isDummyUserId(userId)) return;

  if (brazeOptOutIdentityCleanup) {
    // Opted-out: do not call changeUser. Prior Braze profile wipe/reset is handled
    // separately before this flag is enabled in production (see LIVE-34717).
    if (isTrackedUser) {
      Braze.changeUser(userId.exportUserIdForBraze());
    }
    return;
  }

  Braze.changeUser(isTrackedUser ? userId.exportUserIdForBraze() : generateAnonymousId());
};

export const updateUserPreferences = (
  notificationsPreferences: NotificationsSettings,
  isTrackedUser: boolean,
) => {
  if (!isTrackedUser) return;

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
