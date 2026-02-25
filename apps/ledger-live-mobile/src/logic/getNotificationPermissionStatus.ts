import { getMessaging, AuthorizationStatus } from "@react-native-firebase/messaging";

export const getNotificationPermissionStatus = async (): Promise<
  (typeof AuthorizationStatus)[keyof typeof AuthorizationStatus]
> => {
  return getMessaging().hasPermission();
};
