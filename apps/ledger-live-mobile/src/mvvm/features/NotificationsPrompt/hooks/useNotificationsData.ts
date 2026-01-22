import { useCallback } from "react";
import { useSelector, useDispatch } from "~/context/hooks";
import { AuthorizationStatus } from "@react-native-firebase/messaging";
import { notificationsSelector, INITIAL_STATE as settingsInitialState } from "~/reducers/settings";
import { setNotifications } from "~/actions/settings";
import { setNotificationsDataOfUser } from "~/actions/notifications";
import { notificationsDataOfUserSelector } from "~/reducers/notifications";
import { NotificationsSettings } from "~/reducers/types";
import { setPushNotificationsDataOfUserInStorage } from "../utils/storage";
import { type DataOfUser } from "../types";
import { updateIdentify } from "~/analytics";

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

  const markUserAsOptIn = useCallback(() => {
    updatePushNotificationsDataOfUserInStateAndStore({
      lastActionAt: Date.now(),
    });
    updateIdentify();
  }, [updatePushNotificationsDataOfUserInStateAndStore]);

  const markUserAsOptOut = useCallback(() => {
    const now = Date.now();
    const dismissedOptInDrawerAtList = [
      ...(pushNotificationsDataOfUser?.dismissedOptInDrawerAtList ?? []),
      now,
    ];

    // when a user is marked as opt out,
    // we will use 2 ways to prompt the opt in drawer:
    // 1. after an action (swap, receive, send, favorite, etc.)
    // 2. after the inactivity period
    updatePushNotificationsDataOfUserInStateAndStore({
      dismissedOptInDrawerAtList,
      lastActionAt: now,
    });
    updateIdentify();
  }, [updatePushNotificationsDataOfUserInStateAndStore, pushNotificationsDataOfUser]);

  const updateUserLastInactiveTime = useCallback(() => {
    // here user can be marked as inactive but we have to keep track of all the times
    // the user dismissed the opt in drawer so we can decide when to show it again
    // (for example, after an inactivity period) without losing the history of past dismissals
    updatePushNotificationsDataOfUserInStateAndStore({
      ...pushNotificationsDataOfUser,
      lastActionAt: Date.now(),
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
          return markUserAsOptIn();
        }
        // User is opted out; mark them for reprompting after the configured delay
        return markUserAsOptOut();
      }

      const hasOptedOut = storedUserData?.dismissedOptInDrawerAtList !== undefined;

      if (hasOptedOut) {
        // User previously opted out → check if they've fully re-enabled notifications
        if (isAuthorized && notifications.areNotificationsAllowed) {
          // Both OS and app notifications enabled → clear opt-out state
          return markUserAsOptIn();
        }

        // Still opted out or partially enabled → maintain opt-out state for reprompting
        return updatePushNotificationsDataOfUserInStateAndStore({
          ...storedUserData,
          lastActionAt: storedUserData?.lastActionAt ?? Date.now(), // keep the last action at to decide when to show the opt in drawer again
        });
      }

      const isDenied = osPermissionStatus === AuthorizationStatus.DENIED;
      // User was marked as opted in but somehow now has denied OS permissions.
      if (!hasOptedOut && isDenied) {
        // Mark as opted out to track dismissal for reprompt scheduling

        return markUserAsOptOut();
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
      markUserAsOptIn,
      updatePushNotificationsDataOfUserInStateAndStore,
      markUserAsOptOut,
    ],
  );

  return {
    notifications,
    pushNotificationsDataOfUser,
    updatePushNotificationsDataOfUserInStateAndStore,
    markUserAsOptIn,
    markUserAsOptOut,
    initializeNotificationSettingsState,
    syncOptOutState,
    updateUserLastInactiveTime,
  };
};
