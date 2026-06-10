import { buildOptOutUserData } from "../buildOptOutUserData";

describe("buildOptOutUserData", () => {
  const now = 1_700_000_000_000;

  it("appends a global dismissal to legacy and per-target lists", () => {
    const result = buildOptOutUserData({
      pushNotificationsDataOfUser: {
        dismissedOptInDrawerAtList: [100],
        lastActionAt: 50,
      },
      now,
    });

    expect(result).toEqual({
      dismissedOptInDrawerAtList: [100, now],
      dismissedPromptAtListByTarget: {
        globalPushNotifications: [100, now],
      },
      lastActionAt: now,
    });
  });

  it("appends a transactions alerts dismissal without changing global dismissals", () => {
    const result = buildOptOutUserData({
      pushNotificationsDataOfUser: {
        dismissedOptInDrawerAtList: [100],
        dismissedPromptAtListByTarget: {
          globalPushNotifications: [100],
        },
        lastActionAt: 50,
      },
      promptTarget: "transactionsAlertsCategory",
      now,
    });

    expect(result).toEqual({
      dismissedOptInDrawerAtList: [100],
      dismissedPromptAtListByTarget: {
        globalPushNotifications: [100],
        transactionsAlertsCategory: [now],
      },
      lastActionAt: now,
    });
  });

  it("appends to an existing transactions alerts dismissal list", () => {
    const result = buildOptOutUserData({
      pushNotificationsDataOfUser: {
        dismissedPromptAtListByTarget: {
          transactionsAlertsCategory: [200],
        },
      },
      promptTarget: "transactionsAlertsCategory",
      now,
    });

    expect(result.dismissedPromptAtListByTarget).toEqual({
      transactionsAlertsCategory: [200, now],
    });
    expect(result.dismissedOptInDrawerAtList).toBeUndefined();
  });
});
