import { useCallback, useMemo } from "react";
import { AuthorizationStatus } from "@react-native-firebase/messaging";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { type DataOfUser } from "../types";
import {
  checkIsInactive,
  getNextRepromptDelay,
  shouldPromptOptInDrawerAfterAction,
} from "../utils/notificationsPromptEngine";

type UseNotificationsPromptParams = {
  permissionStatus:
    | (typeof AuthorizationStatus)[keyof typeof AuthorizationStatus]
    | null
    | undefined;
  areNotificationsAllowed: boolean | undefined;
  pushNotificationsDataOfUser: DataOfUser | null | undefined;
};

export const useNotificationsPrompt = ({
  permissionStatus,
  areNotificationsAllowed,
  pushNotificationsDataOfUser,
}: UseNotificationsPromptParams) => {
  const featureBrazePushNotifications = useFeature("brazePushNotifications");
  const repromptSchedule = featureBrazePushNotifications?.params?.reprompt_schedule;

  const nextRepromptDelay = useMemo(() => {
    return getNextRepromptDelay({
      repromptSchedule,
      pushNotificationsDataOfUser,
    });
  }, [repromptSchedule, pushNotificationsDataOfUser]);

  const shouldPrompt = useCallback(() => {
    return shouldPromptOptInDrawerAfterAction({
      permissionStatus,
      areNotificationsAllowed,
      pushNotificationsDataOfUser,
      repromptSchedule,
    });
  }, [permissionStatus, areNotificationsAllowed, pushNotificationsDataOfUser, repromptSchedule]);

  const inactivityEnabled = featureBrazePushNotifications?.params?.inactivity_enabled;
  const inactivityReprompt = featureBrazePushNotifications?.params?.inactivity_reprompt;

  const isInactive = useCallback(
    (lastActionAt?: number) => {
      return checkIsInactive({
        inactivityEnabled,
        inactivityReprompt,
        lastActionAt,
      });
    },
    [inactivityEnabled, inactivityReprompt],
  );

  return {
    checkIsInactive: isInactive,
    nextRepromptDelay,
    shouldPromptOptInDrawerAfterAction: shouldPrompt,
  };
};
