import { add, sub } from "date-fns";
import type {
  DataOfUser,
  NotificationsPromptRepromptDelay,
} from "LLM/features/NotificationsPrompt";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

type RepromptDuration = NotificationsPromptRepromptDelay;

export const getGlobalPushNotificationsDismissals = (
  pushNotificationsDataOfUser: DataOfUser | null | undefined,
): number[] | undefined => {
  const dismissedPromptAtListByTarget =
    pushNotificationsDataOfUser?.dismissedPromptAtListByTarget ?? {};

  return (
    dismissedPromptAtListByTarget.globalPushNotifications ??
    pushNotificationsDataOfUser?.dismissedOptInDrawerAtList
  );
};

const formatRepromptInDays = (targetMs: number, now: number): string => {
  if (targetMs <= now) {
    return "now (eligible)";
  }

  const remainingMs = targetMs - now;
  if (remainingMs < MS_PER_DAY) {
    return "in less than 1 day";
  }

  const days = Math.ceil(remainingMs / MS_PER_DAY);
  const dayLabel = days === 1 ? "day" : "days";
  return `in ${days} ${dayLabel}`;
};

export const formatDismissalTimestamp = (timestamp: number) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return {
      epochMs: String(timestamp),
      iso: "invalid",
      local: "invalid",
    };
  }

  return {
    epochMs: String(timestamp),
    iso: date.toISOString(),
    local: date.toLocaleString(),
  };
};

export const getAfterActionRepromptLabel = ({
  dismissedOptInDrawerAtList,
  repromptSchedule,
  now,
}: {
  dismissedOptInDrawerAtList: number[] | undefined;
  repromptSchedule: RepromptDuration[] | null | undefined;
  now: number;
}): string => {
  if (!dismissedOptInDrawerAtList?.length) {
    return "now (eligible)";
  }

  if (!repromptSchedule?.length) {
    return "not configured";
  }

  const scheduleIndex = Math.min(
    dismissedOptInDrawerAtList.length - 1,
    repromptSchedule.length - 1,
  );
  const nextRepromptDelay = repromptSchedule[scheduleIndex];
  const lastDismissedAt = dismissedOptInDrawerAtList.at(-1);
  if (lastDismissedAt === undefined) {
    return "now (eligible)";
  }

  return formatRepromptInDays(add(lastDismissedAt, nextRepromptDelay).getTime(), now);
};

export const getInactivityRepromptLabel = ({
  lastActionAt,
  inactivityReprompt,
  inactivityEnabled,
  now,
}: {
  lastActionAt: number | undefined;
  inactivityReprompt: RepromptDuration | null | undefined;
  inactivityEnabled: boolean | undefined;
  now: number;
}): string => {
  if (!inactivityEnabled) {
    return "disabled";
  }

  if (!inactivityReprompt) {
    return "not configured";
  }

  if (lastActionAt === undefined) {
    return "unknown (no lastActionAt)";
  }

  return formatRepromptInDays(add(lastActionAt, inactivityReprompt).getTime(), now);
};

/** Mirrors notificationsPromptEngine: add(timestamp, delay).getTime() <= now */
const getTimestampEligibleForDelay = (delay: RepromptDuration, now: number): number =>
  sub(now, delay).getTime();

const getRepromptDelayForDismissalCount = (
  repromptSchedule: RepromptDuration[] | null | undefined,
  dismissalCount: number,
): RepromptDuration => {
  const fallbackDelay: RepromptDuration = {
    days: 7,
    hours: 0,
    minutes: 0,
    months: 0,
    seconds: 0,
  };
  const schedule = repromptSchedule?.length ? repromptSchedule : [fallbackDelay];
  const scheduleIndex = Math.min(Math.max(dismissalCount, 1) - 1, schedule.length - 1);
  return schedule[scheduleIndex];
};

const getRepromptEligibleDismissalAt = (
  repromptSchedule: RepromptDuration[] | null | undefined,
  dismissalCount: number,
  now: number,
): number =>
  getTimestampEligibleForDelay(
    getRepromptDelayForDismissalCount(repromptSchedule, dismissalCount),
    now,
  );

export const buildRepromptableUserData = (
  pushNotificationsDataOfUser: DataOfUser | null | undefined,
  repromptSchedule: RepromptDuration[] | null | undefined,
  now: number,
): DataOfUser => {
  const dismissedOptInDrawerAtList = [
    ...(getGlobalPushNotificationsDismissals(pushNotificationsDataOfUser) ?? []),
  ];

  const dismissalCount = Math.max(dismissedOptInDrawerAtList.length, 1);
  const repromptableDismissalAt = getRepromptEligibleDismissalAt(
    repromptSchedule,
    dismissalCount,
    now,
  );

  if (!dismissedOptInDrawerAtList.length) {
    dismissedOptInDrawerAtList.push(repromptableDismissalAt);
  } else {
    dismissedOptInDrawerAtList[dismissedOptInDrawerAtList.length - 1] = repromptableDismissalAt;
  }

  return {
    ...pushNotificationsDataOfUser,
    dismissedOptInDrawerAtList,
    dismissedPromptAtListByTarget: {
      ...pushNotificationsDataOfUser?.dismissedPromptAtListByTarget,
      globalPushNotifications: dismissedOptInDrawerAtList,
    },
    lastActionAt: pushNotificationsDataOfUser?.lastActionAt ?? now,
  };
};

export const buildInactiveUserData = (
  pushNotificationsDataOfUser: DataOfUser | null | undefined,
  inactivityReprompt: RepromptDuration | null | undefined,
  now: number,
): DataOfUser => {
  const delay = inactivityReprompt ?? {
    months: 6,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  };

  const inactiveLastActionAt = getTimestampEligibleForDelay(delay, now);

  return {
    ...pushNotificationsDataOfUser,
    lastActionAt: inactiveLastActionAt,
  };
};

export const buildTruncatedDismissalsUserData = (
  pushNotificationsDataOfUser: DataOfUser | null | undefined,
  keepCount: number,
): DataOfUser => {
  const safeKeepCount = Math.max(0, Math.floor(keepCount));
  const dismissedOptInDrawerAtList = (
    getGlobalPushNotificationsDismissals(pushNotificationsDataOfUser) ?? []
  ).slice(0, safeKeepCount);

  return {
    ...pushNotificationsDataOfUser,
    dismissedOptInDrawerAtList,
    dismissedPromptAtListByTarget: {
      ...pushNotificationsDataOfUser?.dismissedPromptAtListByTarget,
      globalPushNotifications: dismissedOptInDrawerAtList,
    },
  };
};
