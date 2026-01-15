import { useCallback } from "react";
import { useSelector, useDispatch } from "~/context/hooks";
import { AuthorizationStatus } from "@react-native-firebase/messaging";
import { updateIdentify } from "~/analytics";
import { notificationsSelector, INITIAL_STATE as settingsInitialState } from "~/reducers/settings";
import { setNotifications } from "~/actions/settings";
import { setNotificationsDataOfUser } from "~/actions/notifications";
import { notificationsDataOfUserSelector } from "~/reducers/notifications";
import { NotificationsSettings } from "~/reducers/types";
import { setPushNotificationsDataOfUserInStorage } from "../utils/storage";
import { type DataOfUser } from "../types";

export const useNotificationsData = () => {
  const notifications = useSelector(notificationsSelector);
  const pushNotificationsDataOfUser = useSelector(notificationsDataOfUserSelector);
  const dispatch = useDispatch();

  const updatePushNotificationsDataOfUserInStateAndStore = useCallback(
    (dataOfUserUpdated: DataOfUser) => {
      dispatch(setNotificationsDataOfUser(dataOfUserUpdated));
      setPushNotificationsDataOfUserInStorage(dataOfUserUpdated);
    },
    [dispatch],
  );

  const resetOptOutState = useCallback(() => {
    updatePushNotificationsDataOfUserInStateAndStore({
      dismissedOptInDrawerAtList: undefined,
    });
  }, [updatePushNotificationsDataOfUserInStateAndStore]);

  const optOutOfNotifications = useCallback(() => {
    const dismissedOptInDrawerAtList = [
      ...(pushNotificationsDataOfUser?.dismissedOptInDrawerAtList ?? []),
      Date.now(),
    ];

    updatePushNotificationsDataOfUserInStateAndStore({
      dismissedOptInDrawerAtList,
    });
  }, [updatePushNotificationsDataOfUserInStateAndStore, pushNotificationsDataOfUser]);

  const initializeNotificationSettingsState = useCallback(() => {
    if (notifications.areNotificationsAllowed === undefined) {
      dispatch(setNotifications(settingsInitialState.notifications));
      return;
    }

    const newNotificationsState = { ...notifications };
    for (const [key, value] of Object.entries(settingsInitialState.notifications)) {
      if (notifications[key as keyof NotificationsSettings] === undefined) {
        newNotificationsState[key as keyof NotificationsSettings] = value;
      }
    }
    dispatch(setNotifications(newNotificationsState));
  }, [dispatch, notifications]);

  const syncOptOutState = useCallback(
    (
      osPermissionStatus: (typeof AuthorizationStatus)[keyof typeof AuthorizationStatus],
      storedUserData: DataOfUser | null,
    ) => {
      const isAuthorized = osPermissionStatus === AuthorizationStatus.AUTHORIZED;

      // Handle legacy users who opted out before the new drawer system
      const hasLegacyOptOutData =
        storedUserData?.alreadyDelayedToLater || storedUserData?.dateOfNextAllowedRequest;
      if (hasLegacyOptOutData) {
        if (isAuthorized && notifications.areNotificationsAllowed) {
          // User is already opted in; prevent re-prompting the opt-in drawer
          return resetOptOutState();
        }
        // User is opted out; mark them for reprompting after the configured delay
        return optOutOfNotifications();
      }

      const isOptOut = storedUserData?.dismissedOptInDrawerAtList !== undefined;

      if (isOptOut) {
        // User previously opted out → check if they've fully re-enabled notifications
        if (isAuthorized && notifications.areNotificationsAllowed) {
          // Both OS and app notifications enabled → clear opt-out state
          updateIdentify();
          return resetOptOutState();
        }

        // Still opted out or partially enabled → maintain opt-out state for reprompting
        return updatePushNotificationsDataOfUserInStateAndStore(storedUserData ?? {});
      }

      const isDenied = osPermissionStatus === AuthorizationStatus.DENIED;
      // User was marked as opted in but somehow now has denied OS permissions.
      if (!isOptOut && isDenied) {
        // Mark as opted out to track dismissal for reprompt scheduling
        updateIdentify();
        return optOutOfNotifications();
      }

      // Explicitly handle remaining authorization states:
      // - NOT_DETERMINED: user has not yet made a choice
      // - PROVISIONAL / EPHEMERAL: limited/temporary permissions
      if (
        osPermissionStatus === AuthorizationStatus.NOT_DETERMINED ||
        osPermissionStatus === AuthorizationStatus.PROVISIONAL ||
        osPermissionStatus === AuthorizationStatus.EPHEMERAL
      ) {
        // For these intermediate states, keep user data in sync without changing opt-out logic
        return updatePushNotificationsDataOfUserInStateAndStore(storedUserData ?? {});
      }

      // Fallback: for any unexpected status values, keep behavior consistent with the default path.
      return updatePushNotificationsDataOfUserInStateAndStore(storedUserData ?? {});
    },
    [
      notifications.areNotificationsAllowed,
      resetOptOutState,
      updatePushNotificationsDataOfUserInStateAndStore,
      optOutOfNotifications,
    ],
  );

  return {
    notifications,
    pushNotificationsDataOfUser,
    updatePushNotificationsDataOfUserInStateAndStore,
    resetOptOutState,
    optOutOfNotifications,
    initializeNotificationSettingsState,
    syncOptOutState,
  };
};
