import type { NotificationPromptHistory, NotificationPromptTarget } from "./schema";

const GLOBAL_PUSH_NOTIFICATIONS_PROMPT_TARGET = "globalPushNotifications" as const;

const getExistingDismissals = (
  history: NotificationPromptHistory | null | undefined,
  target: NotificationPromptTarget,
): number[] => {
  const dismissedPromptAtListByTarget = history?.dismissedPromptAtListByTarget ?? {};

  if (target === GLOBAL_PUSH_NOTIFICATIONS_PROMPT_TARGET) {
    return (
      dismissedPromptAtListByTarget.globalPushNotifications ??
      history?.dismissedOptInDrawerAtList ??
      []
    );
  }

  return dismissedPromptAtListByTarget[target] ?? [];
};

export function backfillGlobalPushNotificationsDismissals(
  history: NotificationPromptHistory,
): NotificationPromptHistory {
  if (history.dismissedPromptAtListByTarget?.globalPushNotifications !== undefined) {
    return history;
  }

  const { dismissedOptInDrawerAtList } = history;
  if (dismissedOptInDrawerAtList === undefined) {
    return history;
  }

  return {
    ...history,
    dismissedPromptAtListByTarget: {
      ...history.dismissedPromptAtListByTarget,
      globalPushNotifications: dismissedOptInDrawerAtList,
    },
  };
}

export function buildNotificationPromptDismissalHistory({
  history,
  target = GLOBAL_PUSH_NOTIFICATIONS_PROMPT_TARGET,
  dismissedAt,
}: {
  history: NotificationPromptHistory | null | undefined;
  target?: NotificationPromptTarget;
  dismissedAt: number;
}): NotificationPromptHistory {
  const existingDismissals = getExistingDismissals(history, target);
  const dismissedPromptAtListByTarget = {
    ...history?.dismissedPromptAtListByTarget,
    [target]: [...existingDismissals, dismissedAt],
  };

  const dismissedOptInDrawerAtList =
    target === GLOBAL_PUSH_NOTIFICATIONS_PROMPT_TARGET
      ? dismissedPromptAtListByTarget.globalPushNotifications
      : history?.dismissedOptInDrawerAtList;

  return {
    ...history,
    dismissedOptInDrawerAtList,
    dismissedPromptAtListByTarget,
    lastActionAt: dismissedAt,
  };
}
