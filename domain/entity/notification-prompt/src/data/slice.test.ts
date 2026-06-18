import notificationPromptReducer, {
  recordLastAction,
  recordPromptDismissed,
  replaceNotificationPromptHistory,
  resetNotificationPromptHistory,
} from "./slice";
import { mockNotificationPromptHistory } from "./schema.mock";

describe("notificationPromptReducer", () => {
  it("records a prompt dismissal for the target", () => {
    const state = notificationPromptReducer(
      undefined,
      recordPromptDismissed({ target: "transactionsAlertsCategory", dismissedAt: 10 }),
    );

    expect(state.dismissedPromptAtListByTarget?.transactionsAlertsCategory).toEqual([10]);
    expect(state.dismissedOptInDrawerAtList).toBeUndefined();
  });

  it("keeps the legacy dismissal list in sync for global push prompts", () => {
    const state = notificationPromptReducer(
      undefined,
      recordPromptDismissed({ target: "globalPushNotifications", dismissedAt: 10 }),
    );

    expect(state.dismissedPromptAtListByTarget?.globalPushNotifications).toEqual([10]);
    expect(state.dismissedOptInDrawerAtList).toEqual([10]);
  });

  it("records the last promptable action timestamp", () => {
    const state = notificationPromptReducer(undefined, recordLastAction(20));

    expect(state.lastActionAt).toBe(20);
  });

  it("replaces and resets history", () => {
    const history = mockNotificationPromptHistory({ lastActionAt: 20 });
    const replaced = notificationPromptReducer(undefined, replaceNotificationPromptHistory(history));

    expect(replaced).toEqual(history);
    expect(notificationPromptReducer(replaced, resetNotificationPromptHistory())).toEqual({});
  });
});
