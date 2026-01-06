import { useCallback, useEffect, useMemo } from "react";
import { AppState, Linking } from "react-native";
import { useSelector, useDispatch } from "~/context/hooks";
import { add, isBefore, isEqual } from "date-fns";
import storage from "LLM/storage";
import { AuthorizationStatus, getMessaging } from "@react-native-firebase/messaging";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import {
  notificationsModalOpenSelector,
  drawerSourceSelector,
  notificationsCurrentRouteNameSelector,
  notificationsEventTriggeredSelector,
  notificationsDataOfUserSelector,
  notificationsModalLockedSelector,
  notificationsPermissionStatusSelector,
} from "~/reducers/notifications";
import {
  setNotificationsModalOpen,
  setNotificationsDrawerSource,
  setNotificationsCurrentRouteName,
  setNotificationsEventTriggered,
  setNotificationsDataOfUser,
  setNotificationPermissionStatus,
} from "~/actions/notifications";
import { setRatingsModalLocked } from "~/actions/ratings";
import { track } from "~/analytics";
import { notificationsSelector, INITIAL_STATE as settingsInitialState } from "~/reducers/settings";
import { NavigatorName, ScreenName } from "~/const/navigation";
import { setNotifications } from "~/actions/settings";
import { NotificationsSettings, type NotificationsState } from "~/reducers/types";
import { getNotificationPermissionStatus } from "./getNotifPermissions";
import { useNavigation } from "@react-navigation/core";

export type DataOfUser = {
  // timestamps in ms of every time the user dismisses the opt in prompt (until he opts in)
  dismissedOptInDrawerAtList?: number[];

  // This old logic is helpful to know if the user has already opted out of notifications
  /** If set, we will not prompt the push notification modal again before this date unless the user triggers it manually from the settings */
  dateOfNextAllowedRequest?: Date;
  /** Whether or not the user clicked on the "Maybe later" cta */
  alreadyDelayedToLater?: boolean;
};

export type EventTrigger = {
  timeout: NodeJS.Timeout;
  /** Name of the current screen route that will maybe trigger the push notification modal */
  route_name: ScreenName;
  /** In milliseconds, delay before triggering the push notification modal */
  timer: number;
  /** Whether the push notification modal is triggered when entering or when leaving the screen */
  type?: "on_enter" | "on_leave";
};

const pushNotificationsDataOfUserStorageKey = "pushNotificationsDataOfUser";

async function getPushNotificationsDataOfUserFromStorage() {
  const dataOfUser = await storage.get<DataOfUser>(pushNotificationsDataOfUserStorageKey);

  if (!dataOfUser || Array.isArray(dataOfUser)) return null;

  return dataOfUser;
}

export async function setPushNotificationsDataOfUserInStorage(dataOfUser: DataOfUser) {
  return storage.save(pushNotificationsDataOfUserStorageKey, dataOfUser);
}

const useNotifications = () => {
  const pushNotificationsFeature = useFeature("brazePushNotifications");

  const notifications = useSelector(notificationsSelector);
  const permissionStatus = useSelector(notificationsPermissionStatusSelector);
  const actionEvents = pushNotificationsFeature?.params?.action_events;
  const repromptSchedule = pushNotificationsFeature?.params?.reprompt_schedule;

  const isPushNotificationsModalOpen = useSelector(notificationsModalOpenSelector);
  const isPushNotificationsModalLocked = useSelector(notificationsModalLockedSelector);
  const drawerSource = useSelector(drawerSourceSelector);
  const pushNotificationsOldRoute = useSelector(notificationsCurrentRouteNameSelector);
  const pushNotificationsEventTriggered = useSelector(notificationsEventTriggeredSelector);
  const pushNotificationsDataOfUser = useSelector(notificationsDataOfUserSelector);

  const dispatch = useDispatch();
  const navigation = useNavigation();

  const hiddenNotificationCategories = useMemo(() => {
    const hiddenCategories = [];
    const categoriesToHide = pushNotificationsFeature?.params?.notificationsCategories ?? [];

    for (const notificationsCategory of categoriesToHide) {
      if (!notificationsCategory?.displayed) {
        hiddenCategories.push(notificationsCategory?.category || "");
      }
    }

    return hiddenCategories;
  }, [pushNotificationsFeature?.params?.notificationsCategories]);

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
    const now = Date.now();

    let dismissedOptInDrawerAtList = pushNotificationsDataOfUser?.dismissedOptInDrawerAtList;

    if (dismissedOptInDrawerAtList === undefined) {
      // First time the user is opting out of notifications
      dismissedOptInDrawerAtList = [now];
    } else {
      dismissedOptInDrawerAtList = [...dismissedOptInDrawerAtList, now];
    }

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
          return resetOptOutState();
        }

        // Still opted out or partially enabled → maintain opt-out state for reprompting
        return updatePushNotificationsDataOfUserInStateAndStore(storedUserData ?? {});
      }

      const isDenied = osPermissionStatus === AuthorizationStatus.DENIED;
      // User was marked as opted in but somehow now has denied OS permissions.
      if (!isOptOut && isDenied) {
        // Mark as opted out to track dismissal for reprompt scheduling
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

        dispatch(setNotificationPermissionStatus(osPermissionStatus));

        return syncOptOutState(osPermissionStatus, storedUserData);
      }

      if (permission.status === "rejected") {
        return updatePushNotificationsDataOfUserInStateAndStore(storedUserData ?? {});
      }
    }

    if (dataOfUserFromStorage.status === "rejected" && permission.status === "fulfilled") {
      const osPermissionStatus = permission.value;
      dispatch(setNotificationPermissionStatus(osPermissionStatus));

      // ignore this case, we will check user status in the next initPushNotificationsData call
      return;
    }
  }, [
    initializeNotificationSettingsState,
    syncOptOutState,
    dispatch,
    updatePushNotificationsDataOfUserInStateAndStore,
  ]);

  useEffect(() => {
    // When user is redirected to the os settings to allow notifications, we need to re-initialize the push notifications data
    const subscription = AppState.addEventListener("change", nextAppState => {
      if (nextAppState === "active") {
        initPushNotificationsData();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [initPushNotificationsData]);

  useEffect(() => {
    return () => {
      if (pushNotificationsEventTriggered?.timeout) {
        clearTimeout(pushNotificationsEventTriggered.timeout);
        dispatch(setRatingsModalLocked(false));
      }
    };
  }, [dispatch, pushNotificationsEventTriggered?.timeout]);

  const requestPushNotificationsPermission = useCallback(async () => {
    const { requestPermission } = getMessaging();

    if (permissionStatus === AuthorizationStatus.NOT_DETERMINED) {
      const permission = await requestPermission();
      dispatch(setNotificationPermissionStatus(permission));
      return permission;
    }

    if (permissionStatus === AuthorizationStatus.DENIED) {
      return Linking.openSettings();
    }

    return permissionStatus;
  }, [dispatch, permissionStatus]);

  const setPushNotificationsModalOpenCallback = useCallback(
    (isOpen: boolean, drawerSource: NotificationsState["drawerSource"] = "generic") => {
      dispatch(setNotificationsModalOpen(isOpen));

      if (isOpen) {
        dispatch(setNotificationsDrawerSource(drawerSource));
        if (!isPushNotificationsModalLocked) {
          dispatch(setRatingsModalLocked(true));
        }
      }

      if (!isOpen) {
        dispatch(setRatingsModalLocked(false));
      }
    },
    [dispatch, isPushNotificationsModalLocked],
  );

  const getRepromptDelay = useCallback(
    (dismissedOptInDrawerAtList?: number[]) => {
      if (!repromptSchedule || !dismissedOptInDrawerAtList) {
        return null;
      }

      if (repromptSchedule.length === 0) {
        return null;
      }

      const dismissalCount = dismissedOptInDrawerAtList.length;
      let scheduleIndex = dismissalCount - 1;

      const lastScheduleIndex = repromptSchedule.length - 1;
      if (scheduleIndex > lastScheduleIndex) {
        // If user has dismissed more than the schedule length, keep using the last delay.
        scheduleIndex = lastScheduleIndex;
      }

      return repromptSchedule[scheduleIndex];
    },
    [repromptSchedule],
  );

  const shouldPromptOptInDrawerCallback = useCallback(() => {
    const isOsPermissionAuthorized = permissionStatus === AuthorizationStatus.AUTHORIZED;
    if (isOsPermissionAuthorized && notifications.areNotificationsAllowed) {
      return false;
    }

    const dismissedOptInDrawerAtList = pushNotificationsDataOfUser?.dismissedOptInDrawerAtList;

    const hasNeverSeenOptInPromptDrawer = dismissedOptInDrawerAtList === undefined;
    if (hasNeverSeenOptInPromptDrawer) {
      return true;
    }

    const dismissalCount = dismissedOptInDrawerAtList.length;
    const repromptDelay = getRepromptDelay(dismissedOptInDrawerAtList);
    if (!repromptDelay) {
      return false;
    }

    const lastDismissedAt = dismissedOptInDrawerAtList[dismissalCount - 1];
    const nextMinimumRepromptAt = add(lastDismissedAt, repromptDelay);
    const now = Date.now();
    if (isBefore(nextMinimumRepromptAt, now) || isEqual(nextMinimumRepromptAt, now)) {
      return true;
    }

    return false;
  }, [
    permissionStatus,
    notifications.areNotificationsAllowed,
    pushNotificationsDataOfUser?.dismissedOptInDrawerAtList,
    getRepromptDelay,
  ]);

  const openDrawer = useCallback(
    (drawerSource: NotificationsState["drawerSource"], routeName: ScreenName, timer = 0) => {
      dispatch(setRatingsModalLocked(true));
      const timeout = setTimeout(() => {
        setPushNotificationsModalOpenCallback(true, drawerSource);
      }, timer);
      dispatch(
        setNotificationsEventTriggered({
          route_name: routeName,
          timer,
          timeout,
        }),
      );
    },
    [dispatch, setPushNotificationsModalOpenCallback],
  );

  const handleRouteChangePushNotification = useCallback(
    (newRoute: ScreenName): boolean => {
      if (pushNotificationsEventTriggered?.timeout) {
        clearTimeout(pushNotificationsEventTriggered?.timeout);
        dispatch(setRatingsModalLocked(false));
      }

      const triggerEvents = pushNotificationsFeature?.params?.trigger_events ?? [];

      for (const eventTrigger of triggerEvents) {
        const isEntering = eventTrigger.type === "on_enter" && eventTrigger.route_name === newRoute;
        const isLeaving =
          eventTrigger.type === "on_leave" && eventTrigger.route_name === pushNotificationsOldRoute;

        if (isEntering || isLeaving) {
          const shouldPrompt = shouldPromptOptInDrawerCallback();
          if (!shouldPrompt) {
            return false;
          }

          openDrawer("generic", newRoute, eventTrigger.timer);
          return true;
        }
      }

      dispatch(setNotificationsCurrentRouteName(newRoute));
      return false;
    },
    [
      pushNotificationsEventTriggered?.timeout,
      pushNotificationsFeature?.params?.trigger_events,
      dispatch,
      pushNotificationsOldRoute,
      shouldPromptOptInDrawerCallback,
      openDrawer,
    ],
  );

  const tryTriggerPushNotificationDrawerAfterAction = useCallback(
    (actionSource: Exclude<NotificationsState["drawerSource"], "generic">) => {
      if (!pushNotificationsFeature?.enabled || isPushNotificationsModalLocked || !actionEvents) {
        return;
      }

      const shouldPrompt = shouldPromptOptInDrawerCallback();
      if (!shouldPrompt) {
        return;
      }

      switch (actionSource) {
        case "onboarding": {
          const onboardingParams = actionEvents?.complete_onboarding;
          if (!onboardingParams?.enabled) {
            return;
          }
          // requestAnimationFrame is needed here for onboarding. Otherwise it won't open the drawer
          requestAnimationFrame(() => {
            openDrawer("onboarding", ScreenName.Portfolio, onboardingParams?.timer);
          });
          break;
        }
        case "add_favorite_coin": {
          const addFavoriteCoinParams = actionEvents?.add_favorite_coin;
          if (!addFavoriteCoinParams?.enabled) {
            return;
          }

          openDrawer("add_favorite_coin", ScreenName.MarketDetail, addFavoriteCoinParams?.timer);
          break;
        }
        case "buy": {
          const buyParams = actionEvents?.buy;
          if (!buyParams?.enabled) {
            return;
          }

          openDrawer("buy", ScreenName.ExchangeBuy, buyParams?.timer);
          break;
        }
        case "send": {
          const sendParams = actionEvents?.send;
          if (!sendParams?.enabled) {
            return;
          }

          openDrawer("send", ScreenName.SendCoin, sendParams?.timer);
          break;
        }
        case "receive": {
          const receiveParams = actionEvents?.receive;
          if (!receiveParams?.enabled) {
            return;
          }

          openDrawer("receive", ScreenName.ReceiveConfirmation, receiveParams?.timer);
          break;
        }

        case "swap": {
          const swapParams = actionEvents?.swap;
          if (!swapParams?.enabled) {
            return;
          }

          openDrawer("swap", ScreenName.Swap, swapParams?.timer);
          break;
        }
        case "stake": {
          const stakeParams = actionEvents?.stake;
          if (!stakeParams?.enabled) {
            return;
          }
          openDrawer("stake", ScreenName.Stake, stakeParams?.timer);
          break;
        }
        default: {
          console.error(`Unknown action source: ${actionSource}`);
          break;
        }
      }
    },
    [
      pushNotificationsFeature?.enabled,
      isPushNotificationsModalLocked,
      actionEvents,
      shouldPromptOptInDrawerCallback,
      openDrawer,
    ],
  );

  const trackButtonClicked = useCallback(
    (eventName: string) => {
      track("button_clicked", {
        button: eventName,
        page: "Drawer push notification opt-in",
        source: drawerSource,
        repromptDelay: getRepromptDelay(pushNotificationsDataOfUser?.dismissedOptInDrawerAtList),
        dismissedCount: pushNotificationsDataOfUser?.dismissedOptInDrawerAtList?.length ?? 0,
        // variant: "A" || "B",
      });
    },
    [drawerSource, getRepromptDelay, pushNotificationsDataOfUser?.dismissedOptInDrawerAtList],
  );

  const handleDelayLaterPress = useCallback(() => {
    trackButtonClicked("maybe later");
    setPushNotificationsModalOpenCallback(false);

    optOutOfNotifications();
  }, [trackButtonClicked, setPushNotificationsModalOpenCallback, optOutOfNotifications]);

  const handleCloseFromBackdropPress = useCallback(() => {
    trackButtonClicked("backdrop");

    setPushNotificationsModalOpenCallback(false);

    optOutOfNotifications();
  }, [trackButtonClicked, setPushNotificationsModalOpenCallback, optOutOfNotifications]);

  const handleAllowNotificationsPress = useCallback(async () => {
    trackButtonClicked("allow notifications");
    setPushNotificationsModalOpenCallback(false);

    if (permissionStatus !== AuthorizationStatus.AUTHORIZED) {
      const permission = await requestPushNotificationsPermission();
      if (permission === AuthorizationStatus.DENIED) {
        trackButtonClicked("os_notifications_deny");
        optOutOfNotifications();
      } else if (permission === AuthorizationStatus.AUTHORIZED) {
        trackButtonClicked("os_notifications_allow");
        resetOptOutState();
      }
    }

    if (!notifications.areNotificationsAllowed) {
      navigation.navigate(NavigatorName.Settings, {
        screen: ScreenName.NotificationsSettings,
      });
    }
  }, [
    trackButtonClicked,
    setPushNotificationsModalOpenCallback,
    permissionStatus,
    notifications.areNotificationsAllowed,
    requestPushNotificationsPermission,
    optOutOfNotifications,
    resetOptOutState,
    navigation,
  ]);

  return {
    initPushNotificationsData,

    permissionStatus,
    handleRouteChangePushNotification,
    pushNotificationsOldRoute,

    drawerSource,

    getRepromptDelay,
    pushNotificationsDataOfUser,

    isPushNotificationsModalOpen,

    hiddenNotificationCategories,

    requestPushNotificationsPermission,

    tryTriggerPushNotificationDrawerAfterAction,

    resetOptOutState,
    optOutOfNotifications,

    handleAllowNotificationsPress,
    handleDelayLaterPress,
    handleCloseFromBackdropPress,

    shouldPromptOptInDrawerCallback,
  };
};

export { useNotifications };
