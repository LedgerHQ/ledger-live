import { AuthorizationStatus } from "@react-native-firebase/messaging";
import type { NotificationsSettings } from "~/reducers/types";

export type NotificationCategory = Exclude<
  keyof NotificationsSettings,
  "areNotificationsAllowed" | "announcementsCategory" | "largeMoverCategory"
>;

export type NotificationPromptTarget = "globalPushNotifications" | NotificationCategory;

export type DataOfUser = {
  // timestamps in ms of every time the user dismisses the opt in prompt (until he opts in)
  dismissedOptInDrawerAtList?: number[];
  dismissedPromptAtListByTarget?: Partial<Record<NotificationPromptTarget, number[]>>;

  // timestamp in ms of the last action user did (swap, receive, send, favorite, etc.)
  lastActionAt?: number;

  // This old logic is helpful to know if the user has already opted out of notifications
  /** If set, we will not prompt the push notification modal again before this date unless the user triggers it manually from the settings */
  dateOfNextAllowedRequest?: Date;
  /** Whether or not the user clicked on the "Maybe later" cta */
  alreadyDelayedToLater?: boolean;
};

export type InitPushNotificationsDataResult =
  | {
      status: "success";
      storedUserData: DataOfUser | null;
      osPermissionStatus: (typeof AuthorizationStatus)[keyof typeof AuthorizationStatus];
      areAppNotificationsEnabled: boolean;
    }
  | {
      status: "error";
      reason: string;
    };
