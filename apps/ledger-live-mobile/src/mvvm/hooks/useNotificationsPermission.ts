import { useCallback } from "react";
import { Linking } from "react-native";
import { useSelector, useDispatch } from "~/context/hooks";
import { AuthorizationStatus, getMessaging } from "@react-native-firebase/messaging";
import { notificationsPermissionStatusSelector } from "~/reducers/notifications";
import { setNotificationPermissionStatus } from "~/actions/notifications";
import { updateIdentify } from "~/analytics";

export const useNotificationsPermission = () => {
  const permissionStatus = useSelector(notificationsPermissionStatusSelector);

  const dispatch = useDispatch();
  const setPermissionStatus = useCallback(
    (status: (typeof AuthorizationStatus)[keyof typeof AuthorizationStatus]) => {
      dispatch(setNotificationPermissionStatus(status));
    },
    [dispatch],
  );

  const requestPushNotificationsPermission = useCallback(async () => {
    const { requestPermission, hasPermission } = getMessaging();

    const resolvedStatus =
      permissionStatus !== undefined && permissionStatus !== null
        ? permissionStatus
        : await hasPermission();

    if (resolvedStatus === AuthorizationStatus.NOT_DETERMINED) {
      const permission = await requestPermission();
      setPermissionStatus(permission);
      updateIdentify();
      return permission;
    }

    if (resolvedStatus === AuthorizationStatus.DENIED) {
      return Linking.openSettings();
    }

    return resolvedStatus;
  }, [permissionStatus, setPermissionStatus]);

  return {
    permissionStatus,
    requestPushNotificationsPermission,
    setPermissionStatus,
  };
};
