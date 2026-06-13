import type { DataOfUser, NotificationPromptTarget } from "../types";
import {
  GLOBAL_PUSH_NOTIFICATIONS_PROMPT_TARGET,
  resolveDismissedPromptAtList,
} from "./dismissedPrompts";

export const buildOptOutUserData = ({
  pushNotificationsDataOfUser,
  promptTarget = GLOBAL_PUSH_NOTIFICATIONS_PROMPT_TARGET,
  now = Date.now(),
}: {
  pushNotificationsDataOfUser: DataOfUser | null | undefined;
  promptTarget?: NotificationPromptTarget;
  now?: number;
}): DataOfUser => {
  const existingDismissals = resolveDismissedPromptAtList(
    pushNotificationsDataOfUser,
    promptTarget,
  );
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
