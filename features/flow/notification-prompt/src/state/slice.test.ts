import notificationPromptFlowReducer, {
  clearNotificationPromptIntent,
  closeNotificationPromptDrawer,
  emitNotificationPromptIntent,
  openNotificationPromptDrawer,
  selectNotificationPromptDrawer,
  selectNotificationPromptIntent,
  type NotificationPromptFlowRootState,
} from "./slice";

describe("notificationPromptFlowReducer", () => {
  it("opens and closes the prompt drawer", () => {
    const opened = notificationPromptFlowReducer(
      undefined,
      openNotificationPromptDrawer({
        source: "send",
        target: "globalPushNotifications",
      }),
    );

    expect(opened).toMatchObject({
      isOpen: true,
      source: "send",
      target: "globalPushNotifications",
      pendingIntent: null,
    });

    expect(notificationPromptFlowReducer(opened, closeNotificationPromptDrawer())).toMatchObject({
      isOpen: false,
      source: null,
      target: null,
      pendingIntent: null,
    });
  });

  it("emits and clears prompt intents", () => {
    const dismissedAt = Date.UTC(2026, 0, 1);
    const state = notificationPromptFlowReducer(
      undefined,
      emitNotificationPromptIntent({
        type: "dismiss",
        target: "globalPushNotifications",
        dismissedAt,
      }),
    );

    expect(state.pendingIntent).toEqual({
      type: "dismiss",
      target: "globalPushNotifications",
      dismissedAt,
    });
    expect(notificationPromptFlowReducer(state, clearNotificationPromptIntent()).pendingIntent).toBe(
      null,
    );
  });

  it("selects drawer state and pending intent", () => {
    const state: NotificationPromptFlowRootState = {
      notificationPromptFlow: {
        isOpen: true,
        source: "receive",
        target: "transactionsAlertsCategory",
        pendingIntent: {
          type: "accept",
          target: "transactionsAlertsCategory",
        },
      },
    };

    expect(selectNotificationPromptDrawer(state)).toBe(state.notificationPromptFlow);
    expect(selectNotificationPromptIntent(state)).toEqual({
      type: "accept",
      target: "transactionsAlertsCategory",
    });
  });
});
