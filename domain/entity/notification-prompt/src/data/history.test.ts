import {
  backfillGlobalPushNotificationsDismissals,
  buildNotificationPromptDismissalHistory,
} from "./history";
import type { NotificationPromptHistory } from "./schema";

describe("backfillGlobalPushNotificationsDismissals", () => {
  it("returns the same object when globalPushNotifications is already defined", () => {
    const history: NotificationPromptHistory = {
      dismissedOptInDrawerAtList: [1, 2],
      dismissedPromptAtListByTarget: { globalPushNotifications: [3] },
    };

    expect(backfillGlobalPushNotificationsDismissals(history)).toBe(history);
  });

  it("copies dismissedOptInDrawerAtList when globalPushNotifications is missing", () => {
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

  it("preserves other targets when backfilling globalPushNotifications", () => {
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

  it("does not mutate data when dismissedOptInDrawerAtList is undefined", () => {
    const history: NotificationPromptHistory = { lastActionAt: 42 };

    expect(backfillGlobalPushNotificationsDismissals(history)).toBe(history);
  });
});

describe("buildNotificationPromptDismissalHistory", () => {
  const dismissedAt = 1_700_000_000_000;

  it("appends a global dismissal to legacy and per-target lists", () => {
    const result = buildNotificationPromptDismissalHistory({
      history: {
        dismissedOptInDrawerAtList: [100],
        lastActionAt: 50,
      },
      dismissedAt,
    });

    expect(result).toEqual({
      dismissedOptInDrawerAtList: [100, dismissedAt],
      dismissedPromptAtListByTarget: {
        globalPushNotifications: [100, dismissedAt],
      },
      lastActionAt: dismissedAt,
    });
  });

  it("appends a transactions alerts dismissal without changing global dismissals", () => {
    const result = buildNotificationPromptDismissalHistory({
      history: {
        dismissedOptInDrawerAtList: [100],
        dismissedPromptAtListByTarget: {
          globalPushNotifications: [100],
        },
        lastActionAt: 50,
      },
      target: "transactionsAlertsCategory",
      dismissedAt,
    });

    expect(result).toEqual({
      dismissedOptInDrawerAtList: [100],
      dismissedPromptAtListByTarget: {
        globalPushNotifications: [100],
        transactionsAlertsCategory: [dismissedAt],
      },
      lastActionAt: dismissedAt,
    });
  });

  it("appends to an existing transactions alerts dismissal list", () => {
    const result = buildNotificationPromptDismissalHistory({
      history: {
        dismissedPromptAtListByTarget: {
          transactionsAlertsCategory: [200],
        },
      },
      target: "transactionsAlertsCategory",
      dismissedAt,
    });

    expect(result.dismissedPromptAtListByTarget).toEqual({
      transactionsAlertsCategory: [200, dismissedAt],
    });
    expect(result.dismissedOptInDrawerAtList).toBeUndefined();
  });
});
