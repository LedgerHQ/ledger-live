import { useCallback, useMemo } from "react";
import { Linking, Platform } from "react-native";
import { useSelector, useDispatch } from "~/context/store";
import { add, isBefore, isEqual } from "date-fns";
import storage from "LLM/storage";
import { getMessaging, AuthorizationStatus } from "@react-native-firebase/messaging";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import {
  notificationsModalOpenSelector,
  notificationsModalTypeSelector,
  notificationsCurrentRouteNameSelector,
  notificationsEventTriggeredSelector,
  notificationsDataOfUserSelector,
  notificationsModalLockedSelector,
} from "~/reducers/notifications";
import {
  setNotificationsModalOpen,
  setNotificationsModalType,
  setNotificationsCurrentRouteName,
  setNotificationsEventTriggered,
  setNotificationsDataOfUser,
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
import Braze from "@braze/react-native-sdk";
import { getIsNotifEnabled } from "./getNotifPermissions";

export type EventTrigger = {
  timeout: NodeJS.Timeout;
  /** Name of the route that will trigger the push notification modal */
  // camelcase perhaps it should
  // eslint-disable-next-line camelcase
  route_name: string;
  /** In milliseconds, delay before triggering the push notification modal */
  timer: number;
  /** Whether the push notification modal is triggered when entering or when leaving the screen */
  type?: "on_enter" | "on_leave";
};

export type DataOfUser = {
  /** Date of the first time the user oppened the app */
  appFirstStartDate?: Date;
  /** Number of times the user oppened the application */
  numberOfAppStarts?: number;

  optedOutAt?: number; // timestamp in milliseconds

  // dates the user dismissed the opt in prompt
  // we will check the last entry in the array
  // but we will also need to check the previous entries to compute the duration between the dismissals
  dismissedOptInDrawerAtList?: number[]; // timestamps in milliseconds

  // TODO: to remove them once we have the new logic in place.
  // This old logic is helpful to know if the user has already opted out of notifications
  /** If set, we will not prompt the push notification modal again before this date unless the user triggers it manually from the settings */
  dateOfNextAllowedRequest?: Date;
  /** Whether or not the user clicked on the "Maybe later" cta */
  alreadyDelayedToLater?: boolean;
};

export type NotificationCategory = {
  /** Whether or not the category is displayed in the Ledger Wallet notifications settings */
  displayed?: boolean;
  /** The key of the category */
  category?: string;
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
  const pushNotificationsModalType = useSelector(notificationsModalTypeSelector);
  const pushNotificationsOldRoute = useSelector(notificationsCurrentRouteNameSelector);
  const pushNotificationsEventTriggered = useSelector(notificationsEventTriggeredSelector);
  const pushNotificationsDataOfUser = useSelector(notificationsDataOfUserSelector);

  const dispatch = useDispatch();

  const updatePushNotificationsDataOfUserInStateAndStore = useCallback(
    (dataOfUserUpdated: DataOfUser) => {
      dispatch(setNotificationsDataOfUser(dataOfUserUpdated));
      setPushNotificationsDataOfUserInStorage(dataOfUserUpdated);
    },
    [dispatch],
  );

  const initPushNotificationsData = useCallback(() => {
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

    // TODO: handle when the user has opted out of notifications from the system settings
    getPushNotificationsDataOfUserFromStorage().then(dataOfUser => {
      updatePushNotificationsDataOfUserInStateAndStore({
        ...(dataOfUser ?? {}),
      });
    });
  }, [dispatch, notifications, updatePushNotificationsDataOfUserInStateAndStore]);

  const requestPushNotificationsPermission = useCallback(async () => {
    if (Platform.OS === "android") {
      // Braze.requestPushPermission() is a no-op on Android 12 and below so we only call it on Android 13 and above
      if (neverClickedOnAllowNotificationsButton && Platform.Version >= 33) {
        Braze.requestPushPermission();
      } else {
        Linking.openSettings();
      }
    } else {
      const permission = await getMessaging().hasPermission();

      if (permission === AuthorizationStatus.DENIED) {
        Linking.openSettings();
      } else if (
        permission === AuthorizationStatus.NOT_DETERMINED ||
        permission === AuthorizationStatus.PROVISIONAL
      ) {
        Braze.requestPushPermission();
      }
    }
    if (neverClickedOnAllowNotificationsButton) {
      dispatch(setNeverClickedOnAllowNotificationsButton(false));
    }
  }, [neverClickedOnAllowNotificationsButton, dispatch]);

  const setPushNotificationsModalOpenCallback = useCallback(
    (isModalOpen: boolean, modalType: NotificationsState["notificationsModalType"] = "generic") => {
      if (!isModalOpen) {
        dispatch(setNotificationsModalType(modalType));
        dispatch(setNotificationsModalOpen(isModalOpen));
        dispatch(setRatingsModalLocked(false));
      } else if (!isPushNotificationsModalLocked) {
        getIsNotifEnabled().then(isNotifEnabled => {
          if (!isNotifEnabled) {
            dispatch(setNotificationsModalOpen(isModalOpen));
            dispatch(setRatingsModalLocked(true));
          }
        });
      }
    },
    [dispatch, isPushNotificationsModalLocked],
  );

  const isEventTriggered = useCallback(
    (eventTrigger: EventTrigger, newRoute?: string) =>
      (eventTrigger.type === "on_enter" && eventTrigger.route_name === newRoute) ||
      (eventTrigger.type === "on_leave" && eventTrigger.route_name === pushNotificationsOldRoute),
    [pushNotificationsOldRoute],
  );

  const checkShouldPromptOptInDrawer = useCallback(() => {
    const today = new Date().getTime();

    if (!pushNotificationsDataOfUser?.optedOutAt) {
      return true;
    }

    if (!repromptSchedule) {
      return false;
    }

    const dismissedAtList = pushNotificationsDataOfUser.dismissedOptInDrawerAtList ?? [];
    const dismissalCount = Math.max(dismissedAtList.length, 1);
    const lastDismissedOptInDrawerAtMs =
      dismissedAtList[dismissalCount - 1] ?? pushNotificationsDataOfUser.optedOutAt;

    // If user has dismissed more than the schedule length, keep using the last delay.
    const scheduleIndex = Math.min(dismissalCount - 1, repromptSchedule.length - 1);
    const repromptDelay = repromptSchedule[scheduleIndex];
    const nextRepromptAt = add(lastDismissedOptInDrawerAtMs, repromptDelay);

    return isBefore(nextRepromptAt, today) || isEqual(nextRepromptAt, today);
  }, [
    pushNotificationsDataOfUser?.optedOutAt,
    pushNotificationsDataOfUser?.dismissedOptInDrawerAtList,
    repromptSchedule,
  ]);

  const onPushNotificationsRouteChange = useCallback(
    (newRoute: string, isOtherModalOpened = false) => {
      if (pushNotificationsEventTriggered?.timeout) {
        clearTimeout(pushNotificationsEventTriggered?.timeout);
        dispatch(setRatingsModalLocked(false));
      }

      if (isOtherModalOpened) return false;

      // @ts-expect-error TYPINGS
      for (const eventTrigger of pushNotificationsFeature?.params?.trigger_events) {
        // @ts-expect-error TYPINGS
        if (isEventTriggered(eventTrigger, newRoute)) {
          const shouldPromptOptInDrawer = checkShouldPromptOptInDrawer();
          if (!shouldPromptOptInDrawer) {
            return false;
          }

          dispatch(setRatingsModalLocked(true));
          const timeout = setTimeout(() => {
            setPushNotificationsModalOpenCallback(true, "generic");
          }, eventTrigger.timer);
          dispatch(
            // @ts-expect-error TYPINGS
            setNotificationsEventTriggered({
              ...eventTrigger,
              timeout,
            }),
          );
          dispatch(setNotificationsCurrentRouteName(newRoute));
          return true;
        }
      }
      dispatch(setNotificationsCurrentRouteName(newRoute));
      return false;
    },
    [
      checkShouldPromptOptInDrawer,
      pushNotificationsEventTriggered?.timeout,
      dispatch,
      pushNotificationsFeature?.params?.trigger_events,
      isEventTriggered,
      setPushNotificationsModalOpenCallback,
    ],
  );

  const openDrawer = useCallback(
    (
      modalType: NotificationsState["notificationsModalType"],
      timer: number,
      routeName: ScreenName,
    ) => {
      dispatch(setRatingsModalLocked(true));
      const timeout = setTimeout(() => {
        setPushNotificationsModalOpenCallback(true, modalType);
      }, timer ?? 0);
      dispatch(
        setNotificationsEventTriggered({
          route_name: routeName,
          timer: timer ?? 0,
          timeout,
        }),
      );
    },
    [dispatch, setPushNotificationsModalOpenCallback],
  );

  const triggerPushNotificationModalAfterMarketStarredAction = useCallback(() => {
    if (isPushNotificationsModalLocked) return;

    const marketCoinStarredParamsOld = pushNotificationsFeature?.params?.marketCoinStarred;
    // TODO: to remove once we have the new logic in place (action_events.market_starred).
    if (marketCoinStarredParamsOld) {
      if (!marketCoinStarredParamsOld?.enabled) {
        return;
      }
      const shouldPromptOptInDrawer = checkShouldPromptOptInDrawer();
      if (!shouldPromptOptInDrawer) {
        return;
      }

      openDrawer("market_starred", marketCoinStarredParamsOld?.timer ?? 0, ScreenName.MarketDetail);
    } else {
      const marketCoinStarredParams = actionEvents?.market_starred;
      if (!marketCoinStarredParams?.enabled) {
        return;
      }

      const shouldPromptOptInDrawer = checkShouldPromptOptInDrawer();
      if (!shouldPromptOptInDrawer) {
        return;
      }

      openDrawer("market_starred", marketCoinStarredParams?.timer ?? 0, ScreenName.MarketDetail);
    }
  }, [
    checkShouldPromptOptInDrawer,
    isPushNotificationsModalLocked,
    openDrawer,
    actionEvents?.market_starred,
    pushNotificationsFeature?.params?.marketCoinStarred,
  ]);

  const triggerPushNotificationModalAfterFinishingOnboardingNewDevice = useCallback(() => {
    if (!pushNotificationsFeature?.enabled || isPushNotificationsModalLocked) return;

    const justFinishedOnboardingParamsOld =
      pushNotificationsFeature?.params?.justFinishedOnboarding;

    // TODO: to remove once we have the new logic in place (action_events.just_finished_onboarding).
    if (justFinishedOnboardingParamsOld) {
      if (!justFinishedOnboardingParamsOld?.enabled) {
        return;
      }
      const shouldPromptOptInDrawer = checkShouldPromptOptInDrawer();

      if (!shouldPromptOptInDrawer) {
        return;
      }

      openDrawer("generic", justFinishedOnboardingParamsOld?.timer ?? 0, ScreenName.Portfolio);
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

  const optOutOfNotifications = useCallback(() => {
    const today = new Date().getTime();

    // first time opting out
    if (!pushNotificationsDataOfUser?.optedOutAt) {
      updatePushNotificationsDataOfUserInStateAndStore({
        ...pushNotificationsDataOfUser,
        optedOutAt: today,
        dismissedOptInDrawerAtList: [today],
      });
    } else {
      if (!pushNotificationsDataOfUser?.dismissedOptInDrawerAtList) {
        console.error(
          "Notifications: dismissedOptInDrawerAtList is not set and that should not happen...",
        );
      }
      const dismissedOptInDrawerAtList = [
        ...(pushNotificationsDataOfUser?.dismissedOptInDrawerAtList ?? []),
        today,
      ];
      updatePushNotificationsDataOfUserInStateAndStore({
        ...pushNotificationsDataOfUser,
        dismissedOptInDrawerAtList,
      });
    }
  }, [updatePushNotificationsDataOfUserInStateAndStore, pushNotificationsDataOfUser]);

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

  const resetOptOutState = useCallback(() => {
    updatePushNotificationsDataOfUserInStateAndStore({
      ...pushNotificationsDataOfUser,
      optedOutAt: undefined,
      dismissedOptInDrawerAtList: [],
    });
  }, [updatePushNotificationsDataOfUserInStateAndStore, pushNotificationsDataOfUser]);

  const handleAllowNotificationsPress = useCallback(() => {
    track("button_clicked", {
      button: "Allow",
      page: pushNotificationsOldRoute,
      drawer: "Notif",
      // TODO: add the dismissed count and/or the last dismissed date
    });
    setPushNotificationsModalOpenCallback(false);
    requestPushNotificationsPermission();

    resetOptOutState();
  }, [
    pushNotificationsOldRoute,
    setPushNotificationsModalOpenCallback,
    requestPushNotificationsPermission,
    resetOptOutState,
  ]);

  return {
    initPushNotificationsData,

    onPushNotificationsRouteChange,
    pushNotificationsOldRoute,
    pushNotificationsModalType,
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
