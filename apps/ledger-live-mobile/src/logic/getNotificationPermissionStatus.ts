import { getMessaging, AuthorizationStatus } from "@react-native-firebase/messaging";

export type AuthorizationStatusType =
  (typeof AuthorizationStatus)[keyof typeof AuthorizationStatus];

export const getNotificationPermissionStatus = async (): Promise<AuthorizationStatusType> => {
  return getMessaging().hasPermission();
};
