import React, { useCallback, useRef } from "react";
import {
  useNotificationsData,
  useNotificationsDrawer,
  useNotificationsPromptEligibility,
} from "LLM/features/NotificationsPrompt";
import { useNotificationsPermission } from "LLM/hooks/useNotificationsPermission";
import QueuedDrawer from "LLM/components/QueuedDrawer";
import { resolveDrawerPromptTargetForAnalytics } from "LLM/features/NotificationsPrompt/new/notificationsPromptAnalytics";
import type { NotificationPromptTarget } from "LLM/features/NotificationsPrompt/types";
import { TrackScreen } from "~/analytics";
import type { NotificationsState } from "~/reducers/types";
import { NotificationsPromptDrawerView } from "./NotificationsPromptDrawerView";

type DrawerDisplayState = {
  drawerSource: NotificationsState["drawerSource"];
  drawerPromptTarget: NotificationPromptTarget | undefined;
};

export const NotificationsPromptDrawer = () => {
  const { permissionStatus, requestPushNotificationsPermission } = useNotificationsPermission();
  const {
    notifications,
    pushNotificationsDataOfUser,
    enableAppNotifications,
    markUserAsOptIn,
    markUserAsOptOut,
    updateUserLastInactiveTime,
  } = useNotificationsData();
  const { nextRepromptDelay } = useNotificationsPromptEligibility({
    permissionStatus,
    areNotificationsAllowed: notifications.areNotificationsAllowed,
    transactionsAlertsCategory: notifications.transactionsAlertsCategory,
    pushNotificationsDataOfUser,
  });
  const {
    drawerSource,
    drawerPromptTarget,
    isPushNotificationsModalOpen,
    handleAllowNotificationsPress,
    handleDelayLaterPress,
    handleCloseFromBackdropPress,
  } = useNotificationsDrawer({
    permissionStatus,
    pushNotificationsDataOfUser,
    nextRepromptDelay,
    markUserAsOptOut,
    markUserAsOptIn,
    enableAppNotifications,
    requestPushNotificationsPermission,
    updateUserLastInactiveTime,
  });

  const drawerDisplayStateRef = useRef<DrawerDisplayState>({
    drawerSource: undefined,
    drawerPromptTarget: undefined,
  });

  if (isPushNotificationsModalOpen) {
    drawerDisplayStateRef.current = {
      drawerSource,
      drawerPromptTarget,
    };
  }

  const { drawerSource: displayedDrawerSource, drawerPromptTarget: displayedDrawerPromptTarget } =
    drawerDisplayStateRef.current;

  const handleModalHide = useCallback(() => {
    drawerDisplayStateRef.current = {
      drawerSource: undefined,
      drawerPromptTarget: undefined,
    };
  }, []);

  return (
    <QueuedDrawer
      isRequestingToBeOpened={isPushNotificationsModalOpen}
      noCloseButton
      onBackdropPress={handleCloseFromBackdropPress}
      onModalHide={handleModalHide}
    >
      <TrackScreen
        category="Drawer push notification opt-in"
        source={displayedDrawerSource}
        drawerPromptTarget={resolveDrawerPromptTargetForAnalytics(displayedDrawerPromptTarget)}
        repromptDelay={nextRepromptDelay}
        dismissedCount={pushNotificationsDataOfUser?.dismissedOptInDrawerAtList?.length ?? 0}
      />

      <NotificationsPromptDrawerView
        promptTarget={displayedDrawerPromptTarget}
        onAllow={handleAllowNotificationsPress}
        onLater={handleDelayLaterPress}
      />
    </QueuedDrawer>
  );
};
