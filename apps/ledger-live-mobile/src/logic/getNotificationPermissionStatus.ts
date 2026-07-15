import { getMessaging, type FirebaseMessagingTypes } from "@react-native-firebase/messaging";

export const getNotificationPermissionStatus =
  async (): Promise<FirebaseMessagingTypes.AuthorizationStatus> => {
    return getMessaging().hasPermission();
  };
