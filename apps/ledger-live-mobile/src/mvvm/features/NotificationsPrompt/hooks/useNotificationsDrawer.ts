import { useCallback, useRef } from "react";
import { InteractionManager } from "react-native";
import { useSelector, useDispatch } from "~/context/hooks";
import { useNavigation } from "@react-navigation/core";
import { AuthorizationStatus } from "@react-native-firebase/messaging";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { ABTestingVariants } from "@ledgerhq/types-live";
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
  shouldPromptOptInDrawerAfterAction: () => boolean;
  checkIsInactive: (lastActionAt?: number) => boolean;
  markUserAsOptIn: () => void;
  markUserAsOptOut: () => void;
  updateUserLastInactiveTime: () => void;
  requestPushNotificationsPermission: () => Promise<
    void | (typeof AuthorizationStatus)[keyof typeof AuthorizationStatus]
  >;
};

export const useNotificationsDrawer = ({
  permissionStatus,
  areNotificationsAllowed,
  pushNotificationsDataOfUser,
  nextRepromptDelay,
  shouldPromptOptInDrawerAfterAction,
  checkIsInactive,
  markUserAsOptIn,
  markUserAsOptOut,
  requestPushNotificationsPermission,
  updateUserLastInactiveTime,
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

  const tryTriggerPushNotificationDrawerAfterInactivity = useCallback(
    (
      data:
        | {
            status: "success";
            storedUserData: DataOfUser | null;
            osPermissionStatus: (typeof AuthorizationStatus)[keyof typeof AuthorizationStatus];
            areAppNotificationsEnabled: boolean;
          }
        | {
            status: "error";
            reason: string;
          },
    ) => {
      if (!featureBrazePushNotifications?.enabled || isRatingsModalOpen) {
        return;
      }
      if (data.status === "error") {
        return;
      }

      // Group A (variant A) never sees inactivity drawer
      const variant = featureNewWordingNotificationsDrawer?.params?.variant;
      const isVariantA =
        featureNewWordingNotificationsDrawer?.enabled && variant === ABTestingVariants.variantA;
      if (isVariantA) {
        return;
      }

      const isOptOut =
        data.osPermissionStatus !== AuthorizationStatus.AUTHORIZED ||
        !data.areAppNotificationsEnabled;
      if (!isOptOut) {
        return;
      }

      const isInactive = checkIsInactive(data.storedUserData?.lastActionAt);
      if (isInactive) {
        openDrawer("inactivity", 1000);
      }
    },
    [
      featureBrazePushNotifications?.enabled,
      isRatingsModalOpen,
      featureNewWordingNotificationsDrawer?.enabled,
      featureNewWordingNotificationsDrawer?.params?.variant,
      openDrawer,
      checkIsInactive,
    ],
  );

  const tryTriggerPushNotificationDrawerAfterAction = useCallback(
    (actionSource: Exclude<NotificationsState["drawerSource"], undefined | "inactivity">) => {
      if (!featureBrazePushNotifications?.enabled || isRatingsModalOpen || !actionEvents) {
        return;
      }

      const shouldPrompt = shouldPromptOptInDrawerAfterAction();
      if (!shouldPrompt) {
        return;
      }

      const variant = featureNewWordingNotificationsDrawer?.params?.variant;
      const isVariantA =
        featureNewWordingNotificationsDrawer?.enabled && variant === ABTestingVariants.variantA;

      // For non-onboarding actions, Group A (variant A) never shows drawer
      if (actionSource !== "onboarding" && isVariantA) {
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
      shouldPromptOptInDrawerAfterAction,
      featureNewWordingNotificationsDrawer?.enabled,
      featureNewWordingNotificationsDrawer?.params?.variant,
      openDrawer,
    ],
  );

  const trackButtonClicked = useCallback(
    (eventName: string) => {
      const canShowVariant = featureNewWordingNotificationsDrawer?.enabled;

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

    if (drawerSource === "inactivity") {
      updateUserLastInactiveTime();
    } else {
      markUserAsOptOut();
    }
  }, [trackButtonClicked, closeDrawer, markUserAsOptOut, updateUserLastInactiveTime, drawerSource]);

  const handleCloseFromBackdropPress = useCallback(() => {
    trackButtonClicked("backdrop");
    closeDrawer();

    if (drawerSource === "inactivity") {
      updateUserLastInactiveTime();
    } else {
      markUserAsOptOut();
    }
  }, [trackButtonClicked, closeDrawer, markUserAsOptOut, updateUserLastInactiveTime, drawerSource]);

  const handleAllowNotificationsPress = useCallback(async () => {
    trackButtonClicked("allow notifications");
    closeDrawer();

    if (drawerSource === "inactivity") {
      updateUserLastInactiveTime();
    }

    if (permissionStatus !== AuthorizationStatus.AUTHORIZED) {
      const permission = await requestPushNotificationsPermission();
      if (permission === AuthorizationStatus.DENIED) {
        trackButtonClicked("os_notifications_deny");
        markUserAsOptOut();
      } else if (permission === AuthorizationStatus.AUTHORIZED) {
        trackButtonClicked("os_notifications_allow");
        markUserAsOptIn();
      }
    }

    if (!areNotificationsAllowed) {
      navigation.navigate(NavigatorName.Settings, {
        screen: ScreenName.NotificationsSettings,
      });
    }
  }, [
    trackButtonClicked,
    updateUserLastInactiveTime,
    closeDrawer,
    permissionStatus,
    areNotificationsAllowed,
    requestPushNotificationsPermission,
    drawerSource,
    markUserAsOptIn,
    markUserAsOptOut,
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
    tryTriggerPushNotificationDrawerAfterInactivity,
  };
};
