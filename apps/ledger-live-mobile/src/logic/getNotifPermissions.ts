import { getMessaging, AuthorizationStatus } from "@react-native-firebase/messaging";

export const getIsNotifEnabled = async (): Promise<boolean> => {
  const permission = await getMessaging().hasPermission();
  return permission === AuthorizationStatus.AUTHORIZED;
};
