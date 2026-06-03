import type { DataOfUser } from "../types";

/**
 * Migrates legacy `dismissedOptInDrawerAtList` into `dismissedPromptAtListByTarget.globalPushNotifications`
 * when the target-specific list has not been set yet.
 */
export function backfillGlobalPushNotificationsDismissals(dataOfUser: DataOfUser): DataOfUser {
  if (dataOfUser.dismissedPromptAtListByTarget?.globalPushNotifications !== undefined) {
    return dataOfUser;
  }

  const { dismissedOptInDrawerAtList } = dataOfUser;
  if (dismissedOptInDrawerAtList === undefined) {
    return dataOfUser;
  }

  return {
    ...dataOfUser,
    dismissedPromptAtListByTarget: {
      ...dataOfUser.dismissedPromptAtListByTarget,
      globalPushNotifications: dismissedOptInDrawerAtList,
    },
  };
}
