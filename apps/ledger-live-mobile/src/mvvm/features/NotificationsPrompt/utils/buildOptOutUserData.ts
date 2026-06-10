import type { DataOfUser, NotificationPromptTarget } from "../types";

const GLOBAL_PUSH_NOTIFICATIONS_PROMPT_TARGET = "globalPushNotifications" as const;

const getExistingDismissals = (
  pushNotificationsDataOfUser: DataOfUser | null | undefined,
  promptTarget: NotificationPromptTarget,
): number[] => {
  const dismissedPromptAtListByTarget =
    pushNotificationsDataOfUser?.dismissedPromptAtListByTarget ?? {};

  if (promptTarget === GLOBAL_PUSH_NOTIFICATIONS_PROMPT_TARGET) {
    return (
      dismissedPromptAtListByTarget.globalPushNotifications ??
      pushNotificationsDataOfUser?.dismissedOptInDrawerAtList ??
      []
    );
  }

  return dismissedPromptAtListByTarget[promptTarget] ?? [];
};

export const buildOptOutUserData = ({
  pushNotificationsDataOfUser,
  promptTarget = GLOBAL_PUSH_NOTIFICATIONS_PROMPT_TARGET,
  now = Date.now(),
}: {
  pushNotificationsDataOfUser: DataOfUser | null | undefined;
  promptTarget?: NotificationPromptTarget;
  now?: number;
}): DataOfUser => {
  const existingDismissals = getExistingDismissals(pushNotificationsDataOfUser, promptTarget);
  const dismissedPromptAtListByTarget = {
    ...pushNotificationsDataOfUser?.dismissedPromptAtListByTarget,
    [promptTarget]: [...existingDismissals, now],
  };

  const dismissedOptInDrawerAtList =
    promptTarget === GLOBAL_PUSH_NOTIFICATIONS_PROMPT_TARGET
      ? dismissedPromptAtListByTarget.globalPushNotifications
      : pushNotificationsDataOfUser?.dismissedOptInDrawerAtList;

  return {
    ...pushNotificationsDataOfUser,
    dismissedOptInDrawerAtList,
    dismissedPromptAtListByTarget,
    lastActionAt: now,
  };
};
