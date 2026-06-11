import { backfillGlobalPushNotificationsDismissals } from "../backfillGlobalPushNotificationsDismissals";
import type { DataOfUser } from "../../types";

describe("backfillGlobalPushNotificationsDismissals", () => {
  it("should return the same object when globalPushNotifications is already defined", () => {
    const dataOfUser: DataOfUser = {
      dismissedOptInDrawerAtList: [1, 2],
      dismissedPromptAtListByTarget: { globalPushNotifications: [3] },
    };

    expect(backfillGlobalPushNotificationsDismissals(dataOfUser)).toBe(dataOfUser);
  });

  it("should copy dismissedOptInDrawerAtList when globalPushNotifications is missing", () => {
    const legacyDismissals = [100, 200];

    expect(
      backfillGlobalPushNotificationsDismissals({
        dismissedOptInDrawerAtList: legacyDismissals,
      }),
    ).toEqual({
      dismissedOptInDrawerAtList: legacyDismissals,
      dismissedPromptAtListByTarget: { globalPushNotifications: legacyDismissals },
    });
  });

  it("should preserve other targets when backfilling globalPushNotifications", () => {
    const legacyDismissals = [100];
    const categoryDismissals = [300];

    expect(
      backfillGlobalPushNotificationsDismissals({
        dismissedOptInDrawerAtList: legacyDismissals,
        dismissedPromptAtListByTarget: { transactionsAlertsCategory: categoryDismissals },
      }),
    ).toEqual({
      dismissedOptInDrawerAtList: legacyDismissals,
      dismissedPromptAtListByTarget: {
        transactionsAlertsCategory: categoryDismissals,
        globalPushNotifications: legacyDismissals,
      },
    });
  });

  it("should not mutate data when dismissedOptInDrawerAtList is undefined", () => {
    const dataOfUser: DataOfUser = { lastActionAt: 42 };

    expect(backfillGlobalPushNotificationsDismissals(dataOfUser)).toBe(dataOfUser);
  });
});
