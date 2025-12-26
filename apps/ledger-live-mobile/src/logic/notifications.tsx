import { useCallback, useMemo } from "react";
import { Linking, Platform } from "react-native";
import { useSelector, useDispatch } from "~/context/store";
import { add, isBefore, isEqual } from "date-fns";
import storage from "LLM/storage";
import { getMessaging, AuthorizationStatus } from "@react-native-firebase/messaging";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { accountsWithPositiveBalanceCountSelector } from "~/reducers/accounts";
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
  const accountsWithAmountCount = useSelector(accountsWithPositiveBalanceCountSelector);

  console.log(pushNotificationsDataOfUser);
  const dispatch = useDispatch();

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
        ...dataOfUser,
        appFirstStartDate: dataOfUser?.appFirstStartDate ?? new Date(Date.now()),
        numberOfAppStarts: (dataOfUser?.numberOfAppStarts ?? 0) + 1,
      });
    });
  }, [dispatch, notifications, updatePushNotificationsDataOfUserInStateAndStore]);

  const checkShouldPromptOptInDrawer = useCallback(() => {
    const today = new Date().getTime();

    if (
      !pushNotificationsDataOfUser?.optedOutAt ||
      pushNotificationsDataOfUser?.dismissedOptInDrawerAtList?.length === 0
    ) {
      return true;
    }

    const dismissedCount = pushNotificationsDataOfUser.dismissedOptInDrawerAtList?.length ?? 0;
    const lastDismissedOptInDrawerAt =
      pushNotificationsDataOfUser.dismissedOptInDrawerAtList?.[dismissedCount - 1];

    // TODO: get from feature flag, not hardcoded
    const retries = [
      {
        months: 1,
      },
      {
        months: 3,
      },
      {
        months: 6,
      },
    ] as const;

    // if user has dismissed more than retries.length times, then use the last retries
    const retryIntervalIndex = Math.min(dismissedCount - 1, retries.length - 1);
    const retryInterval = retries[retryIntervalIndex];
    const nextDate = add(lastDismissedOptInDrawerAt, retryInterval);

    return isBefore(nextDate, today) || isEqual(nextDate, today);
  }, [
    pushNotificationsDataOfUser?.optedOutAt,
    pushNotificationsDataOfUser?.dismissedOptInDrawerAtList,
  ]);

  const triggerPushNotificationModalAfterMarketStarredAction = useCallback(() => {
    if (isPushNotificationsModalLocked) return;

    const marketCoinStarredParams = pushNotificationsFeature?.params?.marketCoinStarred;
    if (marketCoinStarredParams?.enabled) {
      return;
    }

    const shouldPromptOptInDrawer = checkShouldPromptOptInDrawer();
    if (!shouldPromptOptInDrawer) {
      return;
    }

    dispatch(setRatingsModalLocked(true));
    const timeout = setTimeout(() => {
      setPushNotificationsModalOpenCallback(true, "market_starred");
    }, marketCoinStarredParams?.timer ?? 0);
    dispatch(
      setNotificationsEventTriggered({
        route_name: "MarketDetail",
        timer: marketCoinStarredParams?.timer ?? 0,
        timeout,
      }),
    );
  }, [
    checkShouldPromptOptInDrawer,
    dispatch,
    isPushNotificationsModalLocked,
    pushNotificationsFeature?.params?.marketCoinStarred,
    setPushNotificationsModalOpenCallback,
  ]);

  const triggerPushNotificationModalAfterFinishingOnboardingNewDevice = useCallback(() => {
    if (!pushNotificationsFeature?.enabled || isPushNotificationsModalLocked) return;

    const justFinishedOnboardingParams = pushNotificationsFeature?.params?.justFinishedOnboarding;
    if (!justFinishedOnboardingParams?.enabled) {
      return;
    }
    const shouldPromptOptInDrawer = checkShouldPromptOptInDrawer();

    if (shouldPromptOptInDrawer) {
      return;
    }

    dispatch(setRatingsModalLocked(true));
    const timeout = setTimeout(() => {
      setPushNotificationsModalOpenCallback(true, "generic");
    }, justFinishedOnboardingParams?.timer);
    dispatch(
      setNotificationsEventTriggered({
        route_name: "Portfolio",
        timer: justFinishedOnboardingParams?.timer,
        timeout,
      }),
    );
  }, [
    pushNotificationsFeature?.enabled,
    pushNotificationsFeature?.params?.justFinishedOnboarding,
    isPushNotificationsModalLocked,
    checkShouldPromptOptInDrawer,
    dispatch,
    setPushNotificationsModalOpenCallback,
  ]);

  const triggerPushNotificationModalAfterSendAction = useCallback(() => {
    if (isPushNotificationsModalLocked) return;

    setPushNotificationsModalOpenCallback(true, "send");
  }, [isPushNotificationsModalLocked, setPushNotificationsModalOpenCallback]);

  const triggerPushNotificationModalAfterReceiveAction = useCallback(() => {
    if (isPushNotificationsModalLocked) return;

    setPushNotificationsModalOpenCallback(true, "receive");
  }, [isPushNotificationsModalLocked, setPushNotificationsModalOpenCallback]);

  const triggerPushNotificationModalAfterBuyAction = useCallback(() => {
    if (isPushNotificationsModalLocked) return;

    setPushNotificationsModalOpenCallback(true, "buy");
  }, [isPushNotificationsModalLocked, setPushNotificationsModalOpenCallback]);

  const triggerPushNotificationModalAfterSwapAction = useCallback(() => {
    if (isPushNotificationsModalLocked) return;

    setPushNotificationsModalOpenCallback(true, "swap");
  }, [isPushNotificationsModalLocked, setPushNotificationsModalOpenCallback]);

  const triggerPushNotificationModalAfterStakeAction = useCallback(() => {
    if (isPushNotificationsModalLocked) return;

    setPushNotificationsModalOpenCallback(true, "stake");
  }, [isPushNotificationsModalLocked, setPushNotificationsModalOpenCallback]);

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
