import { useCallback } from "react";
import { Linking, PermissionsAndroid, Platform } from "react-native";
import { useSelector, useDispatch } from "~/context/hooks";
import { AuthorizationStatus, getMessaging } from "@react-native-firebase/messaging";
import { notificationsPermissionStatusSelector } from "~/reducers/notifications";
import { setNotificationPermissionStatus } from "~/actions/notifications";
import { updateIdentify } from "~/analytics";

// Firebase's requestPermission is a no-op on Android, so Android 13+ must request POST_NOTIFICATIONS itself.
const requiresAndroidRuntimePermission = () => Platform.OS === "android" && Platform.Version >= 33;

export const useNotificationsPermission = () => {
  const permissionStatus = useSelector(notificationsPermissionStatusSelector);

  const dispatch = useDispatch();
  const setPermissionStatus = useCallback(
    (status: (typeof AuthorizationStatus)[keyof typeof AuthorizationStatus]) => {
      dispatch(setNotificationPermissionStatus(status));
    },
    [dispatch],
  );

  const requestAndroidPermission = useCallback(async () => {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );

    if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
      return Linking.openSettings();
    }

    const permission =
      result === PermissionsAndroid.RESULTS.GRANTED
        ? AuthorizationStatus.AUTHORIZED
        : AuthorizationStatus.DENIED;
    setPermissionStatus(permission);
    updateIdentify();
    return permission;
  }, [setPermissionStatus]);

  const requestPushNotificationsPermission = useCallback(async () => {
    if (requiresAndroidRuntimePermission() && permissionStatus !== AuthorizationStatus.AUTHORIZED) {
      return requestAndroidPermission();
    }

    const { requestPermission } = getMessaging();

    if (permissionStatus === AuthorizationStatus.NOT_DETERMINED) {
      const permission = await requestPermission();
      setPermissionStatus(permission);
      updateIdentify();
      return permission;
    }

    if (permissionStatus === AuthorizationStatus.DENIED) {
      return Linking.openSettings();
    }

    return permissionStatus;
  }, [permissionStatus, requestAndroidPermission, setPermissionStatus]);

  return {
    permissionStatus,
    requestPushNotificationsPermission,
    setPermissionStatus,
  };
};
