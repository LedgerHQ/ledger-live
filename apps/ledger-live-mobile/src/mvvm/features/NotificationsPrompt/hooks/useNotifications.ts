import { useCallback } from "react";
import { useNavigation } from "@react-navigation/core";
import { AuthorizationStatus } from "@react-native-firebase/messaging";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { track } from "~/analytics";
import { NavigatorName, ScreenName } from "~/const/navigation";
import { useNotificationsPromptContext } from "../components/NotificationsPromptProvider";

const useNotifications = () => {
  const {
    permissionStatus,
    areNotificationsAllowed,
    requestPushNotificationsPermission,
    markUserAsOptIn,
    markUserAsOptOut,
    updateUserLastInactiveTime,
    pushNotificationsDataOfUser,
    drawerSource,
    isPushNotificationsModalOpen,
    nextRepromptDelay,
    isInitialized,
    closeDrawer,
    initPushNotificationsData,
    tryTriggerPushNotificationDrawerAfterInactivity,
    notifyFlowCompleted,
  } = useNotificationsPromptContext();

  const navigation = useNavigation();
  const featureNewWordingNotificationsDrawer = useFeature("lwmNewWordingOptInNotificationsDrawer");

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

  const handleDelayLaterPress = useCallback(() => {
    trackButtonClicked("maybe later");
    closeDrawer();

    if (drawerSource === "inactivity") {
      updateUserLastInactiveTime();
    } else {
      markUserAsOptOut();
    }
  }, [
    trackButtonClicked,
    closeDrawer,
    drawerSource,
    updateUserLastInactiveTime,
    markUserAsOptOut,
  ]);

  const handleCloseFromBackdropPress = useCallback(() => {
    trackButtonClicked("backdrop");
    closeDrawer();

    if (drawerSource === "inactivity") {
      updateUserLastInactiveTime();
    } else {
      markUserAsOptOut();
    }
  }, [
    trackButtonClicked,
    closeDrawer,
    drawerSource,
    updateUserLastInactiveTime,
    markUserAsOptOut,
  ]);

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
    closeDrawer,
    drawerSource,
    updateUserLastInactiveTime,
    permissionStatus,
    areNotificationsAllowed,
    requestPushNotificationsPermission,
    markUserAsOptOut,
    markUserAsOptIn,
    navigation,
  ]);

  return {
    initPushNotificationsData,

    permissionStatus,

    drawerSource,

    nextRepromptDelay,
    pushNotificationsDataOfUser,

    isPushNotificationsModalOpen,
    isInitialized,

    requestPushNotificationsPermission,

    markUserAsOptIn,
    markUserAsOptOut,

    handleAllowNotificationsPress,
    handleDelayLaterPress,
    handleCloseFromBackdropPress,

    notifyFlowCompleted,
    tryTriggerPushNotificationDrawerAfterAction: notifyFlowCompleted,

    tryTriggerPushNotificationDrawerAfterInactivity,
  };
};

export { useNotifications };
