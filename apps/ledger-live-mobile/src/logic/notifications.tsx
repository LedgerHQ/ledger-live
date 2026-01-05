import { useCallback, useEffect, useMemo } from "react";
import { AppState, Linking } from "react-native";
import { useSelector, useDispatch } from "~/context/store";
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
  notificationPermissionStatus,
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

  // TODO: to remove them once we have the new logic in place.
  // This old logic is helpful to know if the user has already opted out of notifications
  /** If set, we will not prompt the push notification modal again before this date unless the user triggers it manually from the settings */
  dateOfNextAllowedRequest?: Date;
  /** Whether or not the user clicked on the "Maybe later" cta */
  alreadyDelayedToLater?: boolean;
};

export type EventTrigger = {
  timeout: NodeJS.Timeout;
  /** Name of the current screen route that will maybe trigger the push notification modal */
  routeName: ScreenName;
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

async function setPushNotificationsDataOfUserInStorage(dataOfUser: DataOfUser) {
  return storage.save(pushNotificationsDataOfUserStorageKey, dataOfUser);
}

const useNotifications = () => {
  const pushNotificationsFeature = useFeature("brazePushNotifications");

  const notifications = useSelector(notificationsSelector);
  const permissionStatus = useSelector(notificationPermissionStatus);
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

    const FIRST_TIME_OPTING_OUT_DISMISSED_OPT_IN_DRAWER_AT_LIST = [now];

    let dismissedOptInDrawerAtList = pushNotificationsDataOfUser?.dismissedOptInDrawerAtList;

    if (typeof dismissedOptInDrawerAtList === "undefined") {
      dismissedOptInDrawerAtList = FIRST_TIME_OPTING_OUT_DISMISSED_OPT_IN_DRAWER_AT_LIST;
    } else {
      dismissedOptInDrawerAtList = [...dismissedOptInDrawerAtList, now];
    }

    updatePushNotificationsDataOfUserInStateAndStore({
      dismissedOptInDrawerAtList,
    });
  }, [updatePushNotificationsDataOfUserInStateAndStore, pushNotificationsDataOfUser]);

  const initPushNotificationsData = useCallback(async () => {
    if (notifications.areNotificationsAllowed === undefined) {
      dispatch(setNotifications(settingsInitialState.notifications));
    } else {
      const newNotificationsState = { ...notifications };
      for (const [key, value] of Object.entries(settingsInitialState.notifications)) {
        if (notifications[key as keyof NotificationsSettings] === undefined) {
          newNotificationsState[key as keyof NotificationsSettings] = value;
        }
      }
      dispatch(setNotifications(newNotificationsState));
    }

    const [permission, dataOfUserFromStorage] = await Promise.allSettled([
      getNotificationPermissionStatus(),
      getPushNotificationsDataOfUserFromStorage(),
    ]);

    if (permission.status === "fulfilled" && dataOfUserFromStorage.status === "fulfilled") {
      dispatch(setNotificationPermissionStatus(permission.value));

      const dismissedOptInDrawerAtList = dataOfUserFromStorage.value?.dismissedOptInDrawerAtList;

      const hasAuthorizedFromOsSettings =
        permission.value === AuthorizationStatus.AUTHORIZED &&
        typeof dismissedOptInDrawerAtList !== "undefined";
      if (hasAuthorizedFromOsSettings) {
        if (notifications.areNotificationsAllowed) {
          // track("os_notifications_allowed_from_settings_and_app_notifications_allowed");
          resetOptOutState();
          return;
        } else {
          // track("os_notifications_allowed_from_settings_but_app_notifications_disabled");
        }
      }

      const hasDeniedFromOsSettings =
        permission.value === AuthorizationStatus.DENIED &&
        typeof dismissedOptInDrawerAtList === "undefined";
      if (hasDeniedFromOsSettings) {
        // track("os_notifications_denied_from_settings");
        optOutOfNotifications();
        return;
      }

      // TODO: for users that have already opted out before the new optimise opt-in notifications feature launches
      const hasAlreadyOptedOutBackwardCompatibility = Boolean(
        pushNotificationsDataOfUser?.alreadyDelayedToLater ||
          pushNotificationsDataOfUser?.dateOfNextAllowedRequest,
      );
      if (hasAlreadyOptedOutBackwardCompatibility) {
        optOutOfNotifications();
        return;
      }

      updatePushNotificationsDataOfUserInStateAndStore({
        ...(dataOfUserFromStorage.value ?? {}),
      });
    }
  }, [
    dispatch,
    notifications,
    optOutOfNotifications,
    pushNotificationsDataOfUser?.alreadyDelayedToLater,
    pushNotificationsDataOfUser?.dateOfNextAllowedRequest,
    resetOptOutState,
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

  const requestPushNotificationsPermission = useCallback(async () => {
    const { requestPermission } = getMessaging();

    if (
      permissionStatus === AuthorizationStatus.NOT_DETERMINED ||
      permissionStatus === AuthorizationStatus.PROVISIONAL
    ) {
      const permission = await requestPermission();
      dispatch(setNotificationPermissionStatus(permission));
      return permission;
    }

    if (permissionStatus === AuthorizationStatus.DENIED) {
      return Linking.openSettings();
    }

    if (permissionStatus === AuthorizationStatus.AUTHORIZED) {
      return Promise.resolve(AuthorizationStatus.AUTHORIZED);
    }
  }, [dispatch, permissionStatus]);

  const setPushNotificationsModalOpenCallback = useCallback(
    (isOpen: boolean, drawerSource: NotificationsState["drawerSource"] = "generic") => {
      if (!isOpen) {
        dispatch(setNotificationsDrawerSource(drawerSource));
        dispatch(setNotificationsModalOpen(isOpen));
        dispatch(setRatingsModalLocked(false));
      }
      if (!isPushNotificationsModalLocked) {
        dispatch(setNotificationsModalOpen(isOpen));
        dispatch(setRatingsModalLocked(true));
      }
    },
    [dispatch, isPushNotificationsModalLocked],
  );

  const getRepromptDelay = useCallback(
    (dismissedOptInDrawerAtList?: number[]) => {
      if (!repromptSchedule || !dismissedOptInDrawerAtList) {
        return null;
      }

      const dismissalCount = dismissedOptInDrawerAtList.length;
      let scheduleIndex = dismissalCount - 1;

      const lastScheduleIndex = repromptSchedule.length - 1;
      if (scheduleIndex > lastScheduleIndex) {
        // If user has dismissed more than the schedule length, keep using the last delay.
        scheduleIndex = lastScheduleIndex;
      }

      const repromptDelay = repromptSchedule[scheduleIndex];

      return repromptDelay;
    },
    [repromptSchedule],
  );

  const verifyShouldPromptOptInDrawer = useCallback(() => {
    const isOsPermissionAuthorized = permissionStatus === AuthorizationStatus.AUTHORIZED;
    if (isOsPermissionAuthorized && notifications.areNotificationsAllowed) {
      return false;
    }

    const dismissedOptInDrawerAtList = pushNotificationsDataOfUser?.dismissedOptInDrawerAtList;

    const hasNeverSeenOptInPromptDrawer = typeof dismissedOptInDrawerAtList === "undefined";
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
    (
      drawerSource: NotificationsState["drawerSource"],
      timer: number = 0,
      routeName: ScreenName,
    ) => {
      dispatch(setRatingsModalLocked(true));
      const timeout = setTimeout(() => {
        setPushNotificationsModalOpenCallback(true, drawerSource);
      }, timer);
      dispatch(
        setNotificationsEventTriggered({
          routeName,
          timer,
          timeout,
        }),
      );
    },
    [dispatch, setPushNotificationsModalOpenCallback],
  );

  const handleRouteChangePushNotification = useCallback(
    (newRoute: ScreenName, isOtherModalOpened = false): boolean => {
      if (pushNotificationsEventTriggered?.timeout) {
        clearTimeout(pushNotificationsEventTriggered?.timeout);
        dispatch(setRatingsModalLocked(false));
      }

      if (isOtherModalOpened) return false;

      const triggerEvents = pushNotificationsFeature?.params?.trigger_events ?? [];

      for (const eventTrigger of triggerEvents) {
        const isEntering = eventTrigger.type === "on_enter" && eventTrigger.route_name === newRoute;
        const isLeaving =
          eventTrigger.type === "on_leave" && eventTrigger.route_name === pushNotificationsOldRoute;

        if (isEntering || isLeaving) {
          const shouldPromptOptInDrawer = verifyShouldPromptOptInDrawer();
          if (!shouldPromptOptInDrawer) {
            return false;
          }

          openDrawer("generic", eventTrigger.timer, newRoute);
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
      verifyShouldPromptOptInDrawer,
      openDrawer,
    ],
  );

  const tryTriggerPushNotificationDrawerAfterAction = useCallback(
    (actionSource: Exclude<NotificationsState["drawerSource"], "generic">) => {
      if (!pushNotificationsFeature?.enabled || isPushNotificationsModalLocked) return;

      const shouldPromptOptInDrawer = verifyShouldPromptOptInDrawer();
      if (!shouldPromptOptInDrawer) {
        return;
      }

      const openDrawerCallback = (
        drawerSource: NotificationsState["drawerSource"],
        timer: number,
        routeName: ScreenName,
      ) => {
        // TODO: it was needed for drawerSource === 'onboarding'. But check for other actions.
        requestIdleCallback(() => {
          openDrawer(drawerSource, timer, routeName);
        });
      };

      switch (actionSource) {
        case "onboarding": {
          const onboardingParams = actionEvents?.complete_onboarding;
          if (!onboardingParams?.enabled) {
            return;
          }
          openDrawerCallback("onboarding", onboardingParams?.timer ?? 0, ScreenName.Portfolio);
          break;
        }
        case "add_favorite_coin": {
          const addFavoriteCoinParams = actionEvents?.add_favorite_coin;
          if (!addFavoriteCoinParams?.enabled) {
            return;
          }

          openDrawerCallback(
            "add_favorite_coin",
            addFavoriteCoinParams?.timer ?? 0,
            ScreenName.MarketDetail,
          );
          break;
        }
        case "buy": {
          const buyParams = actionEvents?.buy;
          if (!buyParams?.enabled) {
            return;
          }

          openDrawerCallback("buy", buyParams?.timer ?? 0, ScreenName.ExchangeBuy);
          break;
        }
        case "send": {
          const sendParams = actionEvents?.send;
          if (!sendParams?.enabled) {
            return;
          }

          openDrawerCallback("send", sendParams?.timer ?? 0, ScreenName.SendCoin);
          break;
        }
        case "receive": {
          const receiveParams = actionEvents?.receive;
          if (!receiveParams?.enabled) {
            return;
          }

          openDrawerCallback("receive", receiveParams?.timer ?? 0, ScreenName.ReceiveConfirmation);
          break;
        }

        case "swap": {
          const swapParams = actionEvents?.swap;
          if (!swapParams?.enabled) {
            return;
          }

          openDrawerCallback("swap", swapParams?.timer ?? 0, ScreenName.Swap);
          break;
        }
        case "stake": {
          const stakeParams = actionEvents?.stake;
          if (!stakeParams?.enabled) {
            return;
          }
          openDrawerCallback("stake", stakeParams?.timer ?? 0, ScreenName.Stake);
          break;
        }
        default: {
          console.warn(`Unknown action source: ${actionSource}`);
          break;
        }
      }
    },
    [
      verifyShouldPromptOptInDrawer,
      isPushNotificationsModalLocked,
      openDrawer,
      pushNotificationsFeature?.enabled,
      actionEvents?.add_favorite_coin,
      actionEvents?.buy,
      actionEvents?.receive,
      actionEvents?.send,
      actionEvents?.stake,
      actionEvents?.swap,
      actionEvents?.complete_onboarding,
    ],
  );

  const trackButtonClicked = useCallback(
    (eventName: string) => {
      track("button_clicked", {
        button: eventName,
        drawer: "Drawer push notification opt-in",
        page: pushNotificationsOldRoute,
        source: drawerSource,
        repromptDelay: getRepromptDelay(pushNotificationsDataOfUser?.dismissedOptInDrawerAtList),
        dismissedCount: pushNotificationsDataOfUser?.dismissedOptInDrawerAtList?.length ?? 0,
        // variant: "A" || "B",
      });
    },
    [
      drawerSource,
      getRepromptDelay,
      pushNotificationsDataOfUser?.dismissedOptInDrawerAtList,
      pushNotificationsOldRoute,
    ],
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

    /**
     * The action that triggered the opening of the push notifications drawer
     */
    drawerSource,

    isPushNotificationsModalOpen,

    hiddenNotificationCategories,

    requestPushNotificationsPermission,

    tryTriggerPushNotificationDrawerAfterAction,

    resetOptOutState,
    optOutOfNotifications,

    handleAllowNotificationsPress,
    handleDelayLaterPress,
    handleCloseFromBackdropPress,
  };
};

export { useNotifications };
