import {
  selectDismissedPromptAtListByTarget,
  selectLastNotificationPromptActionAt,
  selectNotificationPromptHistory,
  type NotificationPromptRootState,
} from "./slice";
import { mockNotificationPromptHistory } from "./schema.mock";

describe("notification prompt selectors", () => {
  const state: NotificationPromptRootState = {
    notificationPrompt: mockNotificationPromptHistory({
      dismissedOptInDrawerAtList: [1],
      dismissedPromptAtListByTarget: {
        transactionsAlertsCategory: [2],
      },
      lastActionAt: 3,
    }),
  };

  it("selects notification prompt history", () => {
    expect(selectNotificationPromptHistory(state)).toBe(state.notificationPrompt);
  });

  it("selects dismissed prompts by target", () => {
    expect(selectDismissedPromptAtListByTarget(state, "transactionsAlertsCategory")).toEqual([2]);
  });

  it("falls back to the legacy global dismissal list", () => {
    expect(selectDismissedPromptAtListByTarget(state, "globalPushNotifications")).toEqual([1]);
  });

  it("selects the last promptable action timestamp", () => {
    expect(selectLastNotificationPromptActionAt(state)).toBe(3);
  });
});
