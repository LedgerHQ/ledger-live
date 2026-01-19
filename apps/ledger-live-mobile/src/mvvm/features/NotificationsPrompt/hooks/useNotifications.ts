import { useCallback, useEffect } from "react";
import { getNotificationPermissionStatus } from "~/logic/getNotificationPermissionStatus";
import { useNotificationsPermission } from "LLM/hooks/useNotificationsPermission";
import { useNotificationsData } from "./useNotificationsData";
import { useNotificationsPrompt } from "./useNotificationsPrompt";
import { useNotificationsDrawer } from "./useNotificationsDrawer";
import { getPushNotificationsDataOfUserFromStorage } from "../utils/storage";

const useNotifications = () => {
  const { permissionStatus, requestPushNotificationsPermission, setPermissionStatus } =
    useNotificationsPermission();

  const {
    notifications,
    pushNotificationsDataOfUser,
    markUserAsOptIn,
    markUserAsOptOut,
    initializeNotificationSettingsState,
    syncOptOutState,
    updatePushNotificationsDataOfUserInStateAndStore,
    updateUserLastInactiveTime,
  } = useNotificationsData();

  const {
    nextRepromptDelay,
    shouldPromptOptInDrawerAfterAction,
    shouldPromptOptInDrawerAfterInactivity,
  } = useNotificationsPrompt({
    permissionStatus,
    areNotificationsAllowed: notifications.areNotificationsAllowed,
    pushNotificationsDataOfUser,
  });

  const {
    isPushNotificationsModalOpen,
    drawerSource,
    eventTimeoutRef,
    tryTriggerPushNotificationDrawerAfterAction,
    tryTriggerPushNotificationDrawerAfterInactivity,
    handleAllowNotificationsPress,
    handleDelayLaterPress,
    handleCloseFromBackdropPress,
  } = useNotificationsDrawer({
    permissionStatus,
    areNotificationsAllowed: notifications.areNotificationsAllowed,
    pushNotificationsDataOfUser,
    nextRepromptDelay,
    shouldPromptOptInDrawerAfterAction,
    shouldPromptOptInDrawerAfterInactivity,
    updateUserLastInactiveTime,
    markUserAsOptOut,
    markUserAsOptIn,
    requestPushNotificationsPermission,
  });

  const initPushNotificationsData = useCallback(async () => {
    initializeNotificationSettingsState();

    const [permission, dataOfUserFromStorage] = await Promise.allSettled([
      getNotificationPermissionStatus(),
      getPushNotificationsDataOfUserFromStorage(),
    ]);

    if (permission.status === "rejected") {
      console.error("Failed to get notification permission status:", permission.reason);
    }

    if (dataOfUserFromStorage.status === "rejected") {
      console.error(
        "Failed to get push notifications user data from storage:",
        dataOfUserFromStorage.reason,
      );
    }

    if (dataOfUserFromStorage.status === "fulfilled") {
      const storedUserData = dataOfUserFromStorage.value;

      if (permission.status === "fulfilled") {
        const osPermissionStatus = permission.value;

        setPermissionStatus(osPermissionStatus);

        syncOptOutState(osPermissionStatus, storedUserData);
      }

      if (permission.status === "rejected") {
        updatePushNotificationsDataOfUserInStateAndStore(storedUserData ?? {});
      }

      return storedUserData;
    }

    if (dataOfUserFromStorage.status === "rejected" && permission.status === "fulfilled") {
      const osPermissionStatus = permission.value;
      setPermissionStatus(osPermissionStatus);

      // ignore this case, we will check user status in the next initPushNotificationsData call
      return;
    }
  }, [
    initializeNotificationSettingsState,
    syncOptOutState,
    setPermissionStatus,
    updatePushNotificationsDataOfUserInStateAndStore,
  ]);

  useEffect(() => {
    return () => {
      if (eventTimeoutRef.current) {
        clearTimeout(eventTimeoutRef.current);
        eventTimeoutRef.current = null;
      }
    };
  }, [eventTimeoutRef]);

  return {
    initPushNotificationsData,

    permissionStatus,

    drawerSource,

    nextRepromptDelay,
    pushNotificationsDataOfUser,

    isPushNotificationsModalOpen,

    requestPushNotificationsPermission,

    markUserAsOptIn,
    markUserAsOptOut,

    handleAllowNotificationsPress,
    handleDelayLaterPress,
    handleCloseFromBackdropPress,

    shouldPromptOptInDrawerAfterAction,
    tryTriggerPushNotificationDrawerAfterAction,

    shouldPromptOptInDrawerAfterInactivity,
    tryTriggerPushNotificationDrawerAfterInactivity,
  };
};

export { useNotifications };
