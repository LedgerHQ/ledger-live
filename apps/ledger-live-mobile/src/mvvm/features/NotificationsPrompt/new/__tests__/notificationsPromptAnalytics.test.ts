import {
  resolveDrawerPromptTargetForAnalytics,
  trackAfterActionDecision,
  trackInactivityDecision,
} from "../notificationsPromptAnalytics";
import { track } from "~/analytics";

jest.mock("~/analytics", () => ({
  track: jest.fn(),
}));

describe("notificationsPromptAnalytics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("defaults undefined drawer prompt targets to globalPushNotifications", () => {
    expect(resolveDrawerPromptTargetForAnalytics(undefined)).toBe("globalPushNotifications");
    expect(resolveDrawerPromptTargetForAnalytics("transactionsAlertsCategory")).toBe(
      "transactionsAlertsCategory",
    );
  });

  it("tracks after-action show decisions with source and drawerPromptTarget", () => {
    trackAfterActionDecision({
      kind: "show",
      source: "send",
      delayMs: 200,
      drawerPromptTarget: "transactionsAlertsCategory",
      dismissedCount: 0,
      nextRepromptDelay: null,
    });

    expect(track).toHaveBeenCalledWith("attempt_to_trigger_push_notification_drawer_after_action", {
      action: "send",
      shouldPrompt: true,
      repromptDelay: null,
      dismissedCount: 0,
      skipReason: undefined,
      drawerPromptTarget: "transactionsAlertsCategory",
    });
  });

  it("tracks after-action skip decisions from engine kind", () => {
    trackAfterActionDecision({
      kind: "skip",
      source: "send",
      reason: "fully_opted_in",
      dismissedCount: 0,
      nextRepromptDelay: null,
    });

    expect(track).toHaveBeenCalledWith("attempt_to_trigger_push_notification_drawer_after_action", {
      action: "send",
      shouldPrompt: false,
      repromptDelay: null,
      dismissedCount: 0,
      skipReason: "fully_opted_in",
      drawerPromptTarget: undefined,
    });
  });

  it("tracks inactivity decisions with drawerPromptTarget when shown", () => {
    trackInactivityDecision({
      kind: "show",
      source: "inactivity",
      delayMs: 1000,
      drawerPromptTarget: "globalPushNotifications",
      dismissedCount: 1,
      nextRepromptDelay: null,
    });

    expect(track).toHaveBeenCalledWith(
      "attempt_to_trigger_push_notification_drawer_after_inactivity",
      {
        shouldPrompt: true,
        repromptDelay: null,
        dismissedCount: 1,
        skipReason: undefined,
        drawerPromptTarget: "globalPushNotifications",
      },
    );
  });
});
