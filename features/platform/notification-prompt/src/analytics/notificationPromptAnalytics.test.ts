import {
  buildAfterActionDecisionAnalytics,
  buildInactivityDecisionAnalytics,
  resolveDrawerPromptTargetForAnalytics,
} from "./notificationPromptAnalytics";

describe("notificationPromptAnalytics", () => {
  it("defaults undefined drawer prompt targets to globalPushNotifications", () => {
    expect(resolveDrawerPromptTargetForAnalytics(undefined)).toBe("globalPushNotifications");
    expect(resolveDrawerPromptTargetForAnalytics("transactionsAlertsCategory")).toBe(
      "transactionsAlertsCategory",
    );
  });

  it("builds after-action show analytics with source and drawerPromptTarget", () => {
    expect(
      buildAfterActionDecisionAnalytics({
        kind: "show",
        source: "send",
        delayMs: 200,
        drawerPromptTarget: "transactionsAlertsCategory",
        dismissedCount: 0,
        nextRepromptDelay: null,
      }),
    ).toEqual({
      event: "attempt_to_trigger_push_notification_drawer_after_action",
      properties: {
        action: "send",
        shouldPrompt: true,
        variant: undefined,
        repromptDelay: null,
        dismissedCount: 0,
        skipReason: undefined,
        drawerPromptTarget: "transactionsAlertsCategory",
      },
    });
  });

  it("builds after-action skip analytics from engine kind", () => {
    expect(
      buildAfterActionDecisionAnalytics({
        kind: "skip",
        source: "send",
        reason: "fully_opted_in",
        dismissedCount: 0,
        nextRepromptDelay: null,
      }),
    ).toEqual({
      event: "attempt_to_trigger_push_notification_drawer_after_action",
      properties: {
        action: "send",
        shouldPrompt: false,
        variant: undefined,
        repromptDelay: null,
        dismissedCount: 0,
        skipReason: "fully_opted_in",
        drawerPromptTarget: undefined,
      },
    });
  });

  it("builds inactivity analytics with drawerPromptTarget when shown", () => {
    expect(
      buildInactivityDecisionAnalytics({
        kind: "show",
        source: "inactivity",
        delayMs: 1000,
        drawerPromptTarget: "globalPushNotifications",
        dismissedCount: 1,
        nextRepromptDelay: null,
      }),
    ).toEqual({
      event: "attempt_to_trigger_push_notification_drawer_after_inactivity",
      properties: {
        shouldPrompt: true,
        variant: undefined,
        repromptDelay: null,
        dismissedCount: 1,
        skipReason: undefined,
        drawerPromptTarget: "globalPushNotifications",
      },
    });
  });
});
