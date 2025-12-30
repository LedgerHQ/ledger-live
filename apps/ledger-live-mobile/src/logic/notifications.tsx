import { useCallback, useMemo } from "react";
import { Linking, Platform } from "react-native";
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
import {
  notificationsSelector,
  INITIAL_STATE as settingsInitialState,
  neverClickedOnAllowNotificationsButtonSelector,
} from "~/reducers/settings";
import { ScreenName } from "~/const/navigation";
import { setNeverClickedOnAllowNotificationsButton, setNotifications } from "~/actions/settings";
import { NotificationsSettings, type NotificationsState } from "~/reducers/types";
import { getIsNotifEnabled, getNotificationPermissionStatus } from "./getNotifPermissions";

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

  const isPushNotificationsModalOpen = useSelector(notificationsModalOpenSelector);
  const isPushNotificationsModalLocked = useSelector(notificationsModalLockedSelector);
  const neverClickedOnAllowNotificationsButton = useSelector(
    neverClickedOnAllowNotificationsButtonSelector,
  );
  const drawerSource = useSelector(drawerSourceSelector);
  const pushNotificationsOldRoute = useSelector(notificationsCurrentRouteNameSelector);
  const pushNotificationsEventTriggered = useSelector(notificationsEventTriggeredSelector);
  const pushNotificationsDataOfUser = useSelector(notificationsDataOfUserSelector);
  console.log("pushNotificationsDataOfUser", pushNotificationsDataOfUser);

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
    const now = Date.now();

    const FIRST_TIME_OPTING_OUT_DISMISSED_OPT_IN_DRAWER_AT_LIST = [now];

    const dismissedOptInDrawerAtList =
      pushNotificationsDataOfUser?.dismissedOptInDrawerAtList ??
      FIRST_TIME_OPTING_OUT_DISMISSED_OPT_IN_DRAWER_AT_LIST;

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
        resetOptOutState();
        return;
      }

      const hasDeniedFromOsSettings =
        permission.value === AuthorizationStatus.DENIED &&
        typeof dismissedOptInDrawerAtList === "undefined";
      if (hasDeniedFromOsSettings) {
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

  const requestPushNotificationsPermission = useCallback(async () => {
    const { requestPermission } = getMessaging();

    if (
      permissionStatus === AuthorizationStatus.NOT_DETERMINED ||
      permissionStatus === AuthorizationStatus.PROVISIONAL
    ) {
      return requestPermission();
    }

    if (permissionStatus === AuthorizationStatus.DENIED) {
      return Linking.openSettings();
    }

    if (permissionStatus === AuthorizationStatus.AUTHORIZED) {
      return Promise.resolve(AuthorizationStatus.AUTHORIZED);
    }
  }, [permissionStatus]);

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

  const checkShouldPromptOptInDrawer = useCallback(() => {
    const PROMPT = true;
    const DO_NOT_PROMPT = false;

    const isOsPermissionAuthorized = permissionStatus === AuthorizationStatus.AUTHORIZED;
    const areNotificationsAllowed = notifications.areNotificationsAllowed;
    if (isOsPermissionAuthorized && areNotificationsAllowed) {
      // user has accepted notifications. No need to prompt the opt in drawer
      return DO_NOT_PROMPT;
    }

    const dismissedOptInDrawerAtList = pushNotificationsDataOfUser?.dismissedOptInDrawerAtList;

    const hasNeverSeenOptInPromptDrawer = typeof dismissedOptInDrawerAtList === "undefined";
    if (hasNeverSeenOptInPromptDrawer) {
      return PROMPT;
    }

    if (!repromptSchedule) {
      // if the feature flag params does not specify a reprompt schedule, avoid prompting the opt in drawer
      return DO_NOT_PROMPT;
    }

    const dismissalCount = dismissedOptInDrawerAtList.length;
    const lastDismissedAt = dismissedOptInDrawerAtList[dismissalCount - 1];

    // If user has dismissed more than the schedule length, keep using the last delay.
    const scheduleIndex = Math.min(dismissalCount - 1, repromptSchedule.length - 1);
    const repromptDelay = repromptSchedule[scheduleIndex];
    const nextMinimumRepromptAt = add(lastDismissedAt, repromptDelay);

    const now = Date.now();
    if (isBefore(nextMinimumRepromptAt, now) || isEqual(nextMinimumRepromptAt, now)) {
      return PROMPT;
    }

    return DO_NOT_PROMPT;
  }, [
    permissionStatus,
    notifications.areNotificationsAllowed,
    repromptSchedule,
    pushNotificationsDataOfUser?.dismissedOptInDrawerAtList,
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
          const shouldPromptOptInDrawer = checkShouldPromptOptInDrawer();
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
      checkShouldPromptOptInDrawer,
      openDrawer,
    ],
  );

  const triggerPushNotificationModalAfterMarketStarredAction = useCallback(() => {
    if (isPushNotificationsModalLocked) return;

    const marketCoinStarredParamsBackwardCompatibility =
      pushNotificationsFeature?.params?.marketCoinStarred;
    // TODO: to remove once we have the new logic in place (action_events.add_favorite_coin).

    if (marketCoinStarredParamsBackwardCompatibility) {
      if (!marketCoinStarredParamsBackwardCompatibility?.enabled) {
        return;
      }
      const shouldPromptOptInDrawer = checkShouldPromptOptInDrawer();
      if (!shouldPromptOptInDrawer) {
        return;
      }

      openDrawer(
        "add_favorite_coin",
        marketCoinStarredParamsBackwardCompatibility?.timer ?? 0,
        ScreenName.MarketDetail,
      );
    } else {
      const marketCoinStarredParams = actionEvents?.add_favorite_coin;
      if (!marketCoinStarredParams?.enabled) {
        return;
      }

      const shouldPromptOptInDrawer = checkShouldPromptOptInDrawer();
      if (!shouldPromptOptInDrawer) {
        return;
      }

      openDrawer("add_favorite_coin", marketCoinStarredParams?.timer ?? 0, ScreenName.MarketDetail);
    }
  }, [
    checkShouldPromptOptInDrawer,
    isPushNotificationsModalLocked,
    openDrawer,
    actionEvents?.add_favorite_coin,
    pushNotificationsFeature?.params?.marketCoinStarred,
  ]);

  const triggerPushNotificationModalAfterFinishingOnboardingNewDevice = useCallback(() => {
    if (!pushNotificationsFeature?.enabled || isPushNotificationsModalLocked) return;

    const justFinishedOnboardingParamsBackwardCompatibility =
      pushNotificationsFeature?.params?.justFinishedOnboarding;

    // TODO: to remove once we have the new logic in place (action_events.just_finished_onboarding).
    if (justFinishedOnboardingParamsBackwardCompatibility) {
      if (!justFinishedOnboardingParamsBackwardCompatibility?.enabled) {
        return;
      }
      const shouldPromptOptInDrawer = checkShouldPromptOptInDrawer();

      if (!shouldPromptOptInDrawer) {
        return;
      }

      openDrawer(
        "onboarding",
        justFinishedOnboardingParamsBackwardCompatibility?.timer ?? 0,
        ScreenName.Portfolio,
      );
    } else {
      const justFinishedOnboardingParams = actionEvents?.just_finished_onboarding;
      if (!justFinishedOnboardingParams?.enabled) {
        return;
      }

      const shouldPromptOptInDrawer = checkShouldPromptOptInDrawer();
      if (!shouldPromptOptInDrawer) {
        return;
      }

      openDrawer("generic", justFinishedOnboardingParams?.timer ?? 0, ScreenName.Portfolio);
    }
  }, [
    pushNotificationsFeature?.enabled,
    pushNotificationsFeature?.params?.justFinishedOnboarding,
    actionEvents?.just_finished_onboarding,
    isPushNotificationsModalLocked,
    checkShouldPromptOptInDrawer,
    openDrawer,
  ]);

  const triggerPushNotificationModalAfterSendAction = useCallback(() => {
    if (!pushNotificationsFeature?.enabled || isPushNotificationsModalLocked) return;

    const sendParams = actionEvents?.send;
    if (!sendParams?.enabled) {
      return;
    }

    const shouldPromptOptInDrawer = checkShouldPromptOptInDrawer();

    if (!shouldPromptOptInDrawer) {
      return;
    }

    openDrawer("send", sendParams?.timer ?? 0, ScreenName.SendCoin);
  }, [
    checkShouldPromptOptInDrawer,
    isPushNotificationsModalLocked,
    openDrawer,
    pushNotificationsFeature?.enabled,
    actionEvents?.send,
  ]);

  const triggerPushNotificationModalAfterReceiveAction = useCallback(() => {
    if (!pushNotificationsFeature?.enabled || isPushNotificationsModalLocked) return;

    const receiveParams = actionEvents?.receive;
    if (!receiveParams?.enabled) {
      return;
    }

    const shouldPromptOptInDrawer = checkShouldPromptOptInDrawer();
    if (!shouldPromptOptInDrawer) {
      return;
    }

    openDrawer("receive", receiveParams?.timer ?? 0, ScreenName.ReceiveConfirmation);
  }, [
    checkShouldPromptOptInDrawer,
    isPushNotificationsModalLocked,
    openDrawer,
    pushNotificationsFeature?.enabled,
    actionEvents?.receive,
  ]);

  const triggerPushNotificationModalAfterBuyAction = useCallback(() => {
    if (!pushNotificationsFeature?.enabled || isPushNotificationsModalLocked) return;

    const buyParams = actionEvents?.buy;
    if (!buyParams?.enabled) {
      return;
    }

    const shouldPromptOptInDrawer = checkShouldPromptOptInDrawer();
    if (!shouldPromptOptInDrawer) {
      return;
    }

    openDrawer("buy", buyParams?.timer ?? 0, ScreenName.ExchangeBuy);
  }, [
    checkShouldPromptOptInDrawer,
    isPushNotificationsModalLocked,
    openDrawer,
    pushNotificationsFeature?.enabled,
    actionEvents?.buy,
  ]);

  const triggerPushNotificationModalAfterSwapAction = useCallback(() => {
    if (!pushNotificationsFeature?.enabled || isPushNotificationsModalLocked) return;

    const swapParams = actionEvents?.swap;
    if (!swapParams?.enabled) {
      return;
    }

    const shouldPromptOptInDrawer = checkShouldPromptOptInDrawer();
    if (!shouldPromptOptInDrawer) {
      return;
    }

    openDrawer("swap", swapParams?.timer ?? 0, ScreenName.Swap);
  }, [
    checkShouldPromptOptInDrawer,
    isPushNotificationsModalLocked,
    openDrawer,
    pushNotificationsFeature?.enabled,
    actionEvents?.swap,
  ]);

  const triggerPushNotificationModalAfterStakeAction = useCallback(() => {
    if (!pushNotificationsFeature?.enabled || isPushNotificationsModalLocked) return;

    const stakeParams = actionEvents?.stake;
    if (!stakeParams?.enabled) {
      return;
    }

    const shouldPromptOptInDrawer = checkShouldPromptOptInDrawer();
    if (!shouldPromptOptInDrawer) {
      return;
    }

    openDrawer("stake", stakeParams?.timer ?? 0, ScreenName.Stake);
  }, [
    checkShouldPromptOptInDrawer,
    isPushNotificationsModalLocked,
    openDrawer,
    pushNotificationsFeature?.enabled,
    actionEvents?.stake,
  ]);

  const handleDelayLaterPress = useCallback(() => {
    track("button_clicked", {
      button: "Maybe Later",
      page: pushNotificationsOldRoute,
      drawer: "Notif",
      // TODO: add the dismissed count and/or the last dismissed date
    });
    setPushNotificationsModalOpenCallback(false);

    optOutOfNotifications();
  }, [pushNotificationsOldRoute, setPushNotificationsModalOpenCallback, optOutOfNotifications]);

  const handleCloseFromBackdropPress = useCallback(() => {
    track("TODO: update when rebasing master");

    setPushNotificationsModalOpenCallback(false);

    optOutOfNotifications();
  }, [setPushNotificationsModalOpenCallback, optOutOfNotifications]);

  const handleAllowNotificationsPress = useCallback(() => {
    track("button_clicked", {
      button: "Allow",
      page: pushNotificationsOldRoute,
      drawer: "Notif",
      // TODO: add the dismissed count and/or the last dismissed date
    });
    setPushNotificationsModalOpenCallback(false);
    requestPushNotificationsPermission().then(permission => {
      if (permission === AuthorizationStatus.DENIED) {
        track("os_notification_permission_denied");
        optOutOfNotifications();
      } else if (permission === AuthorizationStatus.AUTHORIZED) {
        resetOptOutState();
      }
    });
  }, [
    pushNotificationsOldRoute,
    requestPushNotificationsPermission,
    resetOptOutState,
    setPushNotificationsModalOpenCallback,
    optOutOfNotifications,
  ]);

  return {
    initPushNotificationsData,

    handleRouteChangePushNotification,
    pushNotificationsOldRoute,

    /**
     * The action that triggered the opening of the push notifications drawer
     */
    drawerSource,

    isPushNotificationsModalOpen,

    hiddenNotificationCategories,

    getIsNotifEnabled,

    requestPushNotificationsPermission,

    // Actions to trigger (display) the push notifications modal
    triggerPushNotificationModalAfterFinishingOnboardingNewDevice,
    triggerPushNotificationModalAfterMarketStarredAction,
    triggerPushNotificationModalAfterSendAction,
    triggerPushNotificationModalAfterReceiveAction,
    triggerPushNotificationModalAfterBuyAction,
    triggerPushNotificationModalAfterSwapAction,
    triggerPushNotificationModalAfterStakeAction,

    // Actions to handle the push notifications modal
    handleAllowNotificationsPress,
    handleDelayLaterPress,
    handleCloseFromBackdropPress,
  };
};

export default useNotifications;
