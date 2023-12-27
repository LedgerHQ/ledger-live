import { useCallback } from "react";
import { Linking, Platform } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { add, isBefore, parseISO } from "date-fns";
import AsyncStorage from "@react-native-async-storage/async-storage";
import messaging from "@react-native-firebase/messaging";
import useFeature from "@ledgerhq/live-config/featureFlags/useFeature";
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
import { NotificationsSettings } from "~/reducers/types";
import Braze from "@braze/react-native-sdk";

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
  /** If set, we will not prompt the push notification modal again before this date unless the user triggers it manually from the settings */
  dateOfNextAllowedRequest?: Date;
  /** Whether or not the user clicked on the "Maybe later" cta */
  alreadyDelayedToLater?: boolean;
  /** If true, we will not prompt the push notification modal again unless the user triggers it manually from the settings */
  doNotAskAgain?: boolean;
};

export type NotificationCategory = {
  /** Whether or not the category is displayed in the Ledger Live notifications settings */
  displayed?: boolean;
  /** The key of the category */
  category?: string;
};

const pushNotificationsDataOfUserAsyncStorageKey = "pushNotificationsDataOfUser";

async function getPushNotificationsDataOfUserFromStorage() {
  const dataOfUser = await AsyncStorage.getItem(pushNotificationsDataOfUserAsyncStorageKey);
  if (!dataOfUser) return null;

  return JSON.parse(dataOfUser);
}

async function setPushNotificationsDataOfUserInStorage(dataOfUser: DataOfUser) {
  await AsyncStorage.setItem(
    pushNotificationsDataOfUserAsyncStorageKey,
    JSON.stringify(dataOfUser),
  );
}

const getIsNotifEnabled = async () => {
  const authStatus = await messaging().hasPermission();

  return authStatus === messaging.AuthorizationStatus.AUTHORIZED;
};

const useNotifications = () => {
  const pushNotificationsFeature = useFeature("brazePushNotifications");
  const notifications = useSelector(notificationsSelector);

  const notificationsCategoriesHidden = pushNotificationsFeature?.params?.notificationsCategories
    ?.filter((notificationsCategory: NotificationCategory) => !notificationsCategory?.displayed)
    .map((notificationsCategory: NotificationCategory) => notificationsCategory?.category || "");
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

  const dispatch = useDispatch();

  const handlePushNotificationsPermission = useCallback(async () => {
    if (Platform.OS === "android") {
      // Braze.requestPushPermission() is a no-op on Android 12 and below so we only call it on Android 13 and above
      if (neverClickedOnAllowNotificationsButton && Platform.Version >= 33) {
        Braze.requestPushPermission();
      } else {
        Linking.openSettings();
      }
    } else {
      const permission = await messaging().hasPermission();

      if (permission === messaging.AuthorizationStatus.DENIED) {
        Linking.openSettings();
      } else if (
        permission === messaging.AuthorizationStatus.NOT_DETERMINED ||
        permission === messaging.AuthorizationStatus.PROVISIONAL
      ) {
        Braze.requestPushPermission();
      }
    }
    if (neverClickedOnAllowNotificationsButton) {
      dispatch(setNeverClickedOnAllowNotificationsButton(false));
    }
  }, [neverClickedOnAllowNotificationsButton, dispatch]);

  const setPushNotificationsModalOpenCallback = useCallback(
    (isModalOpen: boolean) => {
      if (!isModalOpen) {
        dispatch(setNotificationsModalType("generic"));
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

  const areConditionsMet = useCallback(() => {
    if (!pushNotificationsDataOfUser) return false;

    // criterias depending on last answer to the push notifications modal
    if (pushNotificationsDataOfUser.doNotAskAgain) return false;

    if (
      pushNotificationsDataOfUser.dateOfNextAllowedRequest &&
      isBefore(
        Date.now(),
        typeof pushNotificationsDataOfUser.dateOfNextAllowedRequest === "string"
          ? parseISO(pushNotificationsDataOfUser.dateOfNextAllowedRequest)
          : pushNotificationsDataOfUser.dateOfNextAllowedRequest,
      )
    ) {
      return false;
    }

    // minimum accounts number criteria
    // @ts-expect-error TYPINGS
    const minimumAccountsNumber: number =
      pushNotificationsFeature?.params?.conditions?.minimum_accounts_with_funds_number;
    if (minimumAccountsNumber && accountsWithAmountCount < minimumAccountsNumber) {
      return false;
    }

    // minimum app start number criteria
    // @ts-expect-error TYPINGS
    const minimumAppStartsNumber: number =
      pushNotificationsFeature?.params?.conditions?.minimum_app_starts_number;
    if (
      pushNotificationsDataOfUser.numberOfAppStarts &&
      pushNotificationsDataOfUser.numberOfAppStarts < minimumAppStartsNumber
    ) {
      return false;
    }

    // duration since first app start long enough criteria
    // @ts-expect-error TYPINGS
    const minimumDurationSinceAppFirstStart: Duration =
      pushNotificationsFeature?.params?.conditions?.minimum_duration_since_app_first_start;
    if (
      pushNotificationsDataOfUser.appFirstStartDate &&
      isBefore(
        Date.now(),
        add(pushNotificationsDataOfUser.appFirstStartDate, minimumDurationSinceAppFirstStart),
      )
    ) {
      return false;
    }

    return true;
  }, [
    pushNotificationsDataOfUser,
    pushNotificationsFeature?.params?.conditions?.minimum_accounts_with_funds_number,
    pushNotificationsFeature?.params?.conditions?.minimum_app_starts_number,
    pushNotificationsFeature?.params?.conditions?.minimum_duration_since_app_first_start,
    accountsWithAmountCount,
  ]);

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

      if (isOtherModalOpened || !areConditionsMet()) return false;

      // @ts-expect-error TYPINGS
      for (const eventTrigger of pushNotificationsFeature?.params?.trigger_events) {
        // @ts-expect-error TYPINGS
        if (isEventTriggered(eventTrigger, newRoute)) {
          dispatch(setRatingsModalLocked(true));
          const timeout = setTimeout(() => {
            setPushNotificationsModalOpenCallback(true);
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
      areConditionsMet,
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
    if (notifications && notifications.areNotificationsAllowed === undefined) {
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
    getPushNotificationsDataOfUserFromStorage().then(dataOfUser => {
      updatePushNotificationsDataOfUserInStateAndStore({
        ...dataOfUser,
        appFirstStartDate: dataOfUser?.appFirstStartDate || Date.now(),
        numberOfAppStarts: (dataOfUser?.numberOfAppStarts ?? 0) + 1,
      });
    });
  }, [dispatch, notifications, updatePushNotificationsDataOfUserInStateAndStore]);

  const triggerMarketPushNotificationModal = useCallback(() => {
    if (pushNotificationsDataOfUser?.doNotAskAgain || isPushNotificationsModalLocked) return;
    const marketCoinStarredParams = pushNotificationsFeature?.params?.marketCoinStarred;
    if (marketCoinStarredParams?.enabled) {
      dispatch(setRatingsModalLocked(true));
      const timeout = setTimeout(
        () => {
          dispatch(setNotificationsModalType("market"));
          setPushNotificationsModalOpenCallback(true);
        },
        marketCoinStarredParams?.timer,
      );
      dispatch(
        setNotificationsEventTriggered({
          route_name: "MarketDetail",
          timer: marketCoinStarredParams?.timer,
          timeout,
        }),
      );
    }
  }, [
    dispatch,
    isPushNotificationsModalLocked,
    pushNotificationsDataOfUser?.doNotAskAgain,
    pushNotificationsFeature?.params?.marketCoinStarred,
    setPushNotificationsModalOpenCallback,
  ]);

  const triggerJustFinishedOnboardingNewDevicePushNotificationModal = useCallback(() => {
    if (!pushNotificationsFeature?.enabled || isPushNotificationsModalLocked) return;
    const justFinishedOnboardingParams = pushNotificationsFeature?.params?.justFinishedOnboarding;
    if (justFinishedOnboardingParams?.enabled) {
      dispatch(setRatingsModalLocked(true));
      const timeout = setTimeout(
        () => {
          setPushNotificationsModalOpenCallback(true);
        },
        justFinishedOnboardingParams?.timer,
      );
      dispatch(
        setNotificationsEventTriggered({
          route_name: "Portfolio",
          timer: justFinishedOnboardingParams?.timer,
          timeout,
        }),
      );
    }
  }, [
    pushNotificationsFeature?.enabled,
    isPushNotificationsModalLocked,
    dispatch,
    pushNotificationsFeature?.params?.justFinishedOnboarding,
    setPushNotificationsModalOpenCallback,
  ]);

  const handleSetDateOfNextAllowedRequest = useCallback(
    (delay?: Duration, additionalParams?: Partial<DataOfUser>) => {
      if (delay !== null && delay !== undefined) {
        const dateOfNextAllowedRequest: Date = add(Date.now(), delay);
        updatePushNotificationsDataOfUserInStateAndStore({
          ...pushNotificationsDataOfUser,
          dateOfNextAllowedRequest,
          ...additionalParams,
        });
      }
    },
    [pushNotificationsDataOfUser, updatePushNotificationsDataOfUserInStateAndStore],
  );

  const modalAllowNotifications = useCallback(() => {
    track("button_clicked", {
      button: "Allow",
      page: pushNotificationsOldRoute,
      drawer: "Notif",
    });
    setPushNotificationsModalOpenCallback(false);
    handlePushNotificationsPermission();
    if (pushNotificationsFeature?.params?.conditions?.default_delay_between_two_prompts) {
      handleSetDateOfNextAllowedRequest(
        pushNotificationsFeature?.params?.conditions?.default_delay_between_two_prompts,
      );
    }
  }, [
    pushNotificationsOldRoute,
    setPushNotificationsModalOpenCallback,
    handlePushNotificationsPermission,
    pushNotificationsFeature?.params?.conditions?.default_delay_between_two_prompts,
    handleSetDateOfNextAllowedRequest,
  ]);

  const modalDelayLater = useCallback(() => {
    track("button_clicked", {
      button: "Maybe Later",
      page: pushNotificationsOldRoute,
      drawer: "Notif",
    });
    setPushNotificationsModalOpenCallback(false);
    if (pushNotificationsDataOfUser?.alreadyDelayedToLater) {
      updatePushNotificationsDataOfUserInStateAndStore({
        ...pushNotificationsDataOfUser,
        doNotAskAgain: true,
      });
    } else {
      handleSetDateOfNextAllowedRequest(
        pushNotificationsFeature?.params?.conditions?.maybe_later_delay ||
          pushNotificationsFeature?.params?.conditions?.default_delay_between_two_prompts,
        {
          alreadyDelayedToLater: true,
        },
      );
    }
  }, [
    pushNotificationsOldRoute,
    handleSetDateOfNextAllowedRequest,
    pushNotificationsDataOfUser,
    pushNotificationsFeature?.params?.conditions?.default_delay_between_two_prompts,
    pushNotificationsFeature?.params?.conditions?.maybe_later_delay,
    setPushNotificationsModalOpenCallback,
    updatePushNotificationsDataOfUserInStateAndStore,
  ]);

  return {
    initPushNotificationsData,
    onPushNotificationsRouteChange,
    pushNotificationsOldRoute,
    pushNotificationsModalType,
    isPushNotificationsModalOpen,
    notificationsCategoriesHidden,
    getIsNotifEnabled,
    handlePushNotificationsPermission,
    triggerMarketPushNotificationModal,
    triggerJustFinishedOnboardingNewDevicePushNotificationModal,
    modalAllowNotifications,
    modalDelayLater,
  };
};

export default useNotifications;
