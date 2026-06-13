import { useCallback } from "react";
import { useSelector, useDispatch } from "~/context/hooks";
import { useNavigation } from "@react-navigation/core";
import { AuthorizationStatus } from "@react-native-firebase/messaging";
import { useFeature } from "@features/platform-feature-flags";
import {
  setNotificationsDrawerPromptTarget,
  setNotificationsDrawerSource,
  setNotificationsModalOpen,
} from "~/actions/notifications";
import { setNotifications } from "~/actions/settings";
import { track } from "~/analytics";
import { NavigatorName, ScreenName } from "~/const/navigation";
import { updateUserPreferences } from "~/notifications/braze";
import {
  notificationsDrawerPromptTarget,
  notificationsDrawerSource,
  notificationsModalOpenSelector,
} from "~/reducers/notifications";
import { notificationsSelector } from "~/reducers/settings";
import { type DataOfUser, type NotificationPromptTarget } from "../types";
import { resolveDrawerPromptTargetForAnalytics } from "../new/notificationsPromptAnalytics";
import { isTransactionsAlertsPromptTarget } from "../utils/getNotificationsPromptCopy";

type UseNotificationsDrawerParams = {
  permissionStatus:
    | (typeof AuthorizationStatus)[keyof typeof AuthorizationStatus]
    | null
    | undefined;
  areNotificationsAllowed: boolean | undefined;
  pushNotificationsDataOfUser: DataOfUser | null | undefined;
  nextRepromptDelay: { days?: number; hours?: number; minutes?: number } | null;
  markUserAsOptIn: () => void;
  markUserAsOptOut: (promptTarget?: NotificationPromptTarget) => void;
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
  markUserAsOptIn,
  markUserAsOptOut,
  requestPushNotificationsPermission,
  updateUserLastInactiveTime,
}: UseNotificationsDrawerParams) => {
  const featureNewWordingNotificationsDrawer = useFeature("lwmNewWordingOptInNotificationsDrawer");

  const isPushNotificationsModalOpen = useSelector(notificationsModalOpenSelector);
  const drawerSource = useSelector(notificationsDrawerSource);
  const drawerPromptTarget = useSelector(notificationsDrawerPromptTarget);
  const notifications = useSelector(notificationsSelector);

  const dispatch = useDispatch();
  const navigation = useNavigation();

  const trackButtonClicked = useCallback(
    (eventName: string) => {
      const canShowVariant = featureNewWordingNotificationsDrawer?.enabled;

      track("button_clicked", {
        button: eventName,
        page: "Drawer push notification opt-in",
        source: drawerSource,
        drawerPromptTarget: resolveDrawerPromptTargetForAnalytics(drawerPromptTarget),
        repromptDelay: nextRepromptDelay,
        dismissedCount: pushNotificationsDataOfUser?.dismissedOptInDrawerAtList?.length ?? 0,
        variant: canShowVariant ? featureNewWordingNotificationsDrawer?.params?.variant : undefined,
      });
    },
    [
      drawerSource,
      drawerPromptTarget,
      featureNewWordingNotificationsDrawer?.enabled,
      featureNewWordingNotificationsDrawer?.params?.variant,
      nextRepromptDelay,
      pushNotificationsDataOfUser?.dismissedOptInDrawerAtList,
    ],
  );

  const closeDrawer = useCallback(() => {
    dispatch(setNotificationsModalOpen(false));
  }, [dispatch]);

  const handleModalHide = useCallback(() => {
    // Keep source/target stable while the close animation renders.
    dispatch(setNotificationsDrawerSource(undefined));
    dispatch(setNotificationsDrawerPromptTarget(undefined));
  }, [dispatch]);

  const handleDelayLaterPress = useCallback(() => {
    const promptTargetAtDismiss = drawerPromptTarget;
    trackButtonClicked("maybe later");
    closeDrawer();

    if (drawerSource === "inactivity") {
      updateUserLastInactiveTime();
    } else {
      markUserAsOptOut(promptTargetAtDismiss);
    }
  }, [
    trackButtonClicked,
    closeDrawer,
    drawerPromptTarget,
    markUserAsOptOut,
    updateUserLastInactiveTime,
    drawerSource,
  ]);

  const handleCloseFromBackdropPress = useCallback(() => {
    const promptTargetAtDismiss = drawerPromptTarget;
    trackButtonClicked("backdrop");
    closeDrawer();

    if (drawerSource === "inactivity") {
      updateUserLastInactiveTime();
    } else {
      markUserAsOptOut(promptTargetAtDismiss);
    }
  }, [
    trackButtonClicked,
    closeDrawer,
    drawerPromptTarget,
    markUserAsOptOut,
    updateUserLastInactiveTime,
    drawerSource,
  ]);

  const handleAllowNotificationsPress = useCallback(async () => {
    const promptTargetAtDismiss = drawerPromptTarget;
    trackButtonClicked("allow notifications");
    closeDrawer();

    if (drawerSource === "inactivity") {
      updateUserLastInactiveTime();
    }

    if (isTransactionsAlertsPromptTarget(promptTargetAtDismiss)) {
      dispatch(
        setNotifications({
          transactionsAlertsCategory: true,
        }),
      );
      updateUserPreferences({
        ...notifications,
        transactionsAlertsCategory: true,
      });
      markUserAsOptIn();
      return;
    }

    if (permissionStatus !== AuthorizationStatus.AUTHORIZED) {
      const permission = await requestPushNotificationsPermission();
      if (permission === AuthorizationStatus.DENIED) {
        trackButtonClicked("os_notifications_deny");
        markUserAsOptOut(promptTargetAtDismiss);
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
    drawerPromptTarget,
    dispatch,
    notifications,
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
    drawerPromptTarget,
    handleAllowNotificationsPress,
    handleDelayLaterPress,
    handleCloseFromBackdropPress,
    handleModalHide,
  };
};
