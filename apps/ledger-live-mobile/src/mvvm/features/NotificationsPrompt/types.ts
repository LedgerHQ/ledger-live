import { AuthorizationStatus } from "@react-native-firebase/messaging";
import type { NotificationPromptHistory } from "@domain/entity-notification-prompt";

export type InitPushNotificationsDataResult =
  | {
      status: "success";
      storedUserData: NotificationPromptHistory | null;
      osPermissionStatus: (typeof AuthorizationStatus)[keyof typeof AuthorizationStatus];
      areAppNotificationsEnabled: boolean;
    }
  | {
      status: "error";
      reason: string;
    };
