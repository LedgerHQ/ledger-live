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
