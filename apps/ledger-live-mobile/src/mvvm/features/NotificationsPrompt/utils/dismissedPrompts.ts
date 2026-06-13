import type { DataOfUser, NotificationPromptTarget } from "../types";

export const GLOBAL_PUSH_NOTIFICATIONS_PROMPT_TARGET = "globalPushNotifications" as const;

export const resolveDismissedPromptAtList = (
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

export const resolveDismissedPromptCount = (
  pushNotificationsDataOfUser: DataOfUser | null | undefined,
  promptTarget: NotificationPromptTarget | null | undefined,
): number => {
  if (!promptTarget) {
    return 0;
  }

  return resolveDismissedPromptAtList(pushNotificationsDataOfUser, promptTarget).length;
};
