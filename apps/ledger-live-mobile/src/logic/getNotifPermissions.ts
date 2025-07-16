import messaging from "@react-native-firebase/messaging";

export const getIsNotifEnabled = async () => {
  const authStatus = await messaging().hasPermission();

  return authStatus === messaging.AuthorizationStatus.AUTHORIZED;
};
