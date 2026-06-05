import { useCallback, useMemo } from "react";
import { AuthorizationStatus } from "@react-native-firebase/messaging";
import { useFeature } from "@features/platform-feature-flags";
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
  transactionsAlertsCategory: boolean | undefined;
  pushNotificationsDataOfUser: DataOfUser | null | undefined;
};

export const useNotificationsPrompt = ({
  permissionStatus,
  areNotificationsAllowed,
  transactionsAlertsCategory,
  pushNotificationsDataOfUser,
}: UseNotificationsPromptParams) => {
  const featureBrazePushNotifications = useFeature("brazePushNotifications");
  const repromptSchedule = featureBrazePushNotifications?.params?.reprompt_schedule;

  const nextRepromptDelay = useMemo(() => {
    return getNextRepromptDelay({
      repromptSchedule,
      pushNotificationsDataOfUser,
      permissionStatus,
      areNotificationsAllowed,
      transactionsAlertsCategory,
    });
  }, [
    repromptSchedule,
    pushNotificationsDataOfUser,
    permissionStatus,
    areNotificationsAllowed,
    transactionsAlertsCategory,
  ]);

  const shouldPrompt = useCallback(() => {
    return shouldPromptOptInDrawerAfterAction({
      permissionStatus,
      areNotificationsAllowed,
      transactionsAlertsCategory,
      pushNotificationsDataOfUser,
      repromptSchedule,
    });
  }, [
    permissionStatus,
    areNotificationsAllowed,
    transactionsAlertsCategory,
    pushNotificationsDataOfUser,
    repromptSchedule,
  ]);

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
