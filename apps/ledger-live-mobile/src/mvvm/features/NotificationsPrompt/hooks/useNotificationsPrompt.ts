import { useCallback, useMemo } from "react";
import { add, isAfter, isBefore, isEqual } from "date-fns";
import { AuthorizationStatus } from "@react-native-firebase/messaging";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { type DataOfUser } from "../types";

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
    const dismissedOptInDrawerAtList = pushNotificationsDataOfUser?.dismissedOptInDrawerAtList;
    if (!repromptSchedule || !dismissedOptInDrawerAtList) {
      return null;
    }

    if (repromptSchedule.length === 0) {
      return null;
    }

    const dismissalCount = dismissedOptInDrawerAtList.length;
    let scheduleIndex = dismissalCount - 1;

    const lastScheduleIndex = repromptSchedule.length - 1;
    if (scheduleIndex > lastScheduleIndex) {
      // If user has dismissed more than the schedule length, keep using the last delay.
      scheduleIndex = lastScheduleIndex;
    }

    return repromptSchedule[scheduleIndex];
  }, [repromptSchedule, pushNotificationsDataOfUser?.dismissedOptInDrawerAtList]);

  const shouldPromptOptInDrawerAfterAction = useCallback(() => {
    const isOsPermissionAuthorized = permissionStatus === AuthorizationStatus.AUTHORIZED;
    if (isOsPermissionAuthorized && areNotificationsAllowed) {
      return false;
    }

    const dismissedOptInDrawerAtList = pushNotificationsDataOfUser?.dismissedOptInDrawerAtList;

    const hasNeverSeenOptInPromptDrawer = dismissedOptInDrawerAtList === undefined;
    if (hasNeverSeenOptInPromptDrawer) {
      return true;
    }

    const dismissalCount = dismissedOptInDrawerAtList.length;

    if (!nextRepromptDelay) {
      return false;
    }

    const lastDismissedAt = dismissedOptInDrawerAtList[dismissalCount - 1];
    const nextMinimumRepromptAt = add(lastDismissedAt, nextRepromptDelay);
    const now = Date.now();
    if (isBefore(nextMinimumRepromptAt, now) || isEqual(nextMinimumRepromptAt, now)) {
      return true;
    }

    return false;
  }, [
    permissionStatus,
    areNotificationsAllowed,
    pushNotificationsDataOfUser?.dismissedOptInDrawerAtList,
    nextRepromptDelay,
  ]);

  const inactivityEnabled = featureBrazePushNotifications?.params?.inactivity_enabled;
  const inactivityReprompt = featureBrazePushNotifications?.params?.inactivity_reprompt;

  const checkIsInactive = useCallback(
    (lastActionAt?: number) => {
      if (!inactivityEnabled) return false;
      if (!inactivityReprompt || !lastActionAt) return false;

      const nextRepromptAt = add(lastActionAt, inactivityReprompt);
      const isInactive = isAfter(Date.now(), nextRepromptAt) || isEqual(Date.now(), nextRepromptAt);

      return isInactive;
    },
    [inactivityEnabled, inactivityReprompt],
  );

  return {
    checkIsInactive,
    nextRepromptDelay,
    shouldPromptOptInDrawerAfterAction,
  };
};
