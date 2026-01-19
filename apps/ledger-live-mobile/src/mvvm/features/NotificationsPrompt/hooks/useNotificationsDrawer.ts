import { useCallback, useRef } from "react";
import { InteractionManager } from "react-native";
import { useSelector, useDispatch } from "~/context/hooks";
import { useNavigation } from "@react-navigation/core";
import { AuthorizationStatus } from "@react-native-firebase/messaging";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import {
  notificationsModalOpenSelector,
  notificationsDrawerSource,
} from "~/reducers/notifications";
import { setNotificationsModalOpen, setNotificationsDrawerSource } from "~/actions/notifications";
import { ratingsModalOpenSelector } from "~/reducers/ratings";
import { track } from "~/analytics";
import { NavigatorName, ScreenName } from "~/const/navigation";
import { type NotificationsState } from "~/reducers/types";
import { type DataOfUser } from "../types";

type UseNotificationsDrawerParams = {
  permissionStatus:
    | (typeof AuthorizationStatus)[keyof typeof AuthorizationStatus]
    | null
    | undefined;
  areNotificationsAllowed: boolean | undefined;
  pushNotificationsDataOfUser: DataOfUser | null | undefined;
  nextRepromptDelay: { days?: number; hours?: number; minutes?: number } | null;
  shouldPromptOptInDrawerCallback: () => boolean;
  optOutOfNotifications: () => void;
  resetOptOutState: () => void;
  requestPushNotificationsPermission: () => Promise<
    void | (typeof AuthorizationStatus)[keyof typeof AuthorizationStatus]
  >;
};

export const useNotificationsDrawer = ({
  permissionStatus,
  areNotificationsAllowed,
  pushNotificationsDataOfUser,
  nextRepromptDelay,
  shouldPromptOptInDrawerCallback,
  optOutOfNotifications,
  resetOptOutState,
  requestPushNotificationsPermission,
}: UseNotificationsDrawerParams) => {
  const featureBrazePushNotifications = useFeature("brazePushNotifications");
  const featureNewWordingNotificationsDrawer = useFeature("lwmNewWordingOptInNotificationsDrawer");
  const actionEvents = featureBrazePushNotifications?.params?.action_events;

  const isPushNotificationsModalOpen = useSelector(notificationsModalOpenSelector);
  const isRatingsModalOpen = useSelector(ratingsModalOpenSelector);
  const drawerSource = useSelector(notificationsDrawerSource);

  const dispatch = useDispatch();
  const navigation = useNavigation();
  const eventTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const openDrawer = useCallback(
    (drawerSource: Exclude<NotificationsState["drawerSource"], undefined>, timer = 0) => {
      if (eventTimeoutRef.current) {
        clearTimeout(eventTimeoutRef.current);
        eventTimeoutRef.current = null;
      }

      eventTimeoutRef.current = setTimeout(() => {
        dispatch(setNotificationsModalOpen(true));
        dispatch(setNotificationsDrawerSource(drawerSource));
      }, timer);
    },
    [dispatch],
  );

  const tryTriggerPushNotificationDrawerAfterAction = useCallback(
    (actionSource: Exclude<NotificationsState["drawerSource"], undefined>) => {
      if (!featureBrazePushNotifications?.enabled || isRatingsModalOpen || !actionEvents) {
        return;
      }

      const shouldPrompt = shouldPromptOptInDrawerCallback();
      if (!shouldPrompt) {
        return;
      }

      const openDrawerCallback = (...args: Parameters<typeof openDrawer>) => {
        InteractionManager.runAfterInteractions(() => openDrawer(...args));
      };

      switch (actionSource) {
        case "onboarding": {
          const onboardingParams = actionEvents?.complete_onboarding;
          if (!onboardingParams?.enabled) {
            return;
          }
          openDrawerCallback("onboarding", onboardingParams?.timer);
          break;
        }
        case "add_favorite_coin": {
          const addFavoriteCoinParams = actionEvents?.add_favorite_coin;
          if (!addFavoriteCoinParams?.enabled) {
            return;
          }
          openDrawerCallback("add_favorite_coin", addFavoriteCoinParams?.timer);
          break;
        }
        case "send": {
          const sendParams = actionEvents?.send;
          if (!sendParams?.enabled) {
            return;
          }
          openDrawerCallback("send", sendParams?.timer);
          break;
        }
        case "receive": {
          const receiveParams = actionEvents?.receive;
          if (!receiveParams?.enabled) {
            return;
          }
          openDrawerCallback("receive", receiveParams?.timer);
          break;
        }
        case "swap": {
          const swapParams = actionEvents?.swap;
          if (!swapParams?.enabled) {
            return;
          }
          openDrawerCallback("swap", swapParams?.timer);
          break;
        }
        case "stake": {
          const stakeParams = actionEvents?.stake;
          if (!stakeParams?.enabled) {
            return;
          }
          openDrawerCallback("stake", stakeParams?.timer);
          break;
        }
        default: {
          console.error(`Unknown action source: ${actionSource}`);
          break;
        }
      }
    },
    [
      featureBrazePushNotifications?.enabled,
      isRatingsModalOpen,
      actionEvents,
      shouldPromptOptInDrawerCallback,
      openDrawer,
    ],
  );

  const trackButtonClicked = useCallback(
    (eventName: string) => {
      const canShowVariant =
        drawerSource === "onboarding" && featureNewWordingNotificationsDrawer?.enabled;

      track("button_clicked", {
        button: eventName,
        page: "Drawer push notification opt-in",
        source: drawerSource,
        repromptDelay: nextRepromptDelay,
        dismissedCount: pushNotificationsDataOfUser?.dismissedOptInDrawerAtList?.length ?? 0,
        variant: canShowVariant ? featureNewWordingNotificationsDrawer?.params?.variant : undefined,
      });
    },
    [
      drawerSource,
      featureNewWordingNotificationsDrawer?.enabled,
      featureNewWordingNotificationsDrawer?.params?.variant,
      nextRepromptDelay,
      pushNotificationsDataOfUser?.dismissedOptInDrawerAtList,
    ],
  );

  const closeDrawer = useCallback(() => {
    dispatch(setNotificationsModalOpen(false));
    dispatch(setNotificationsDrawerSource(undefined));
  }, [dispatch]);

  const handleDelayLaterPress = useCallback(() => {
    trackButtonClicked("maybe later");
    closeDrawer();

    optOutOfNotifications();
  }, [trackButtonClicked, closeDrawer, optOutOfNotifications]);

  const handleCloseFromBackdropPress = useCallback(() => {
    trackButtonClicked("backdrop");

    closeDrawer();

    optOutOfNotifications();
  }, [trackButtonClicked, closeDrawer, optOutOfNotifications]);

  const handleAllowNotificationsPress = useCallback(async () => {
    trackButtonClicked("allow notifications");
    closeDrawer();

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

    if (!areNotificationsAllowed) {
      navigation.navigate(NavigatorName.Settings, {
        screen: ScreenName.NotificationsSettings,
      });
    }
  }, [
    trackButtonClicked,
    closeDrawer,
    permissionStatus,
    areNotificationsAllowed,
    requestPushNotificationsPermission,
    optOutOfNotifications,
    resetOptOutState,
    navigation,
  ]);

  return {
    isPushNotificationsModalOpen,
    drawerSource,
    eventTimeoutRef,
    tryTriggerPushNotificationDrawerAfterAction,
    handleAllowNotificationsPress,
    handleDelayLaterPress,
    handleCloseFromBackdropPress,
  };
};
