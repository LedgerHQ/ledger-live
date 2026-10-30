import { AuthorizationStatus, getMessaging, hasPermission } from "@react-native-firebase/messaging";

export type NotificationPermissionStatus =
  (typeof AuthorizationStatus)[keyof typeof AuthorizationStatus];

export const getNotificationPermissionStatus = async (): Promise<NotificationPermissionStatus> => {
  return hasPermission(getMessaging());
};
