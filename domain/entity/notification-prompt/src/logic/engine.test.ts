import {
  INACTIVITY_DRAWER_DELAY_MS,
  checkIsInactive,
  evaluateAfterActionTrigger,
  evaluateInactivityTrigger,
  getNextRepromptDelay,
  getNotificationPromptTarget,
  shouldPromptOptInDrawerAfterAction,
} from "./engine";
import { mockNotificationPromptHistory, mockNotificationPromptPolicy } from "../data/schema.mock";

const NOW = Date.UTC(2026, 0, 8);
const ONE_DAY_BEFORE_NOW = Date.UTC(2026, 0, 7);

const idleContext = {
  isRatingsModalOpen: false,
  isDrawerPending: false,
  now: NOW,
};

describe("getNotificationPromptTarget", () => {
  it("targets global push notifications when global opt-in is incomplete", () => {
    expect(
      getNotificationPromptTarget({
        permissionStatus: "denied",
        areNotificationsAllowed: false,
        transactionsAlertsCategory: true,
      }),
    ).toBe("globalPushNotifications");
  });

  it("targets transactions alerts when global opt-in is complete", () => {
    expect(
      getNotificationPromptTarget({
        permissionStatus: "authorized",
        areNotificationsAllowed: true,
        transactionsAlertsCategory: false,
      }),
    ).toBe("transactionsAlertsCategory");
  });

  it("returns no target when the user is fully opted in", () => {
    expect(
      getNotificationPromptTarget({
        permissionStatus: "authorized",
        areNotificationsAllowed: true,
        transactionsAlertsCategory: true,
      }),
    ).toBeNull();
  });
});

describe("evaluateAfterActionTrigger", () => {
  it("shows the global push prompt when the policy and action are enabled", () => {
    const decision = evaluateAfterActionTrigger(
      {
        source: "send",
        permissionStatus: "denied",
        areNotificationsAllowed: false,
        transactionsAlertsCategory: false,
        history: mockNotificationPromptHistory(),
      },
      {
        ...idleContext,
        policy: mockNotificationPromptPolicy({
          actionEvents: { send: { enabled: true, timer: 250 } },
        }),
      },
    );

    expect(decision).toMatchObject({
      kind: "show",
      source: "send",
      delayMs: 250,
      drawerPromptTarget: "globalPushNotifications",
      dismissedCount: 0,
      nextRepromptDelay: null,
      variant: "B",
    });
  });

  it("shows the transactions alerts prompt when global opt-in is already complete", () => {
    const decision = evaluateAfterActionTrigger(
      {
        source: "send",
        permissionStatus: "authorized",
        areNotificationsAllowed: true,
        transactionsAlertsCategory: false,
        history: mockNotificationPromptHistory(),
      },
      {
        ...idleContext,
        policy: mockNotificationPromptPolicy({
          actionEvents: { send: { enabled: true, timer: 100 } },
        }),
      },
    );

    expect(decision).toMatchObject({
      kind: "show",
      delayMs: 100,
      drawerPromptTarget: "transactionsAlertsCategory",
    });
  });

  it("skips when the transactions alerts category is already enabled", () => {
    const decision = evaluateAfterActionTrigger(
      {
        source: "send",
        permissionStatus: "authorized",
        areNotificationsAllowed: true,
        transactionsAlertsCategory: true,
        history: mockNotificationPromptHistory(),
      },
      {
        ...idleContext,
        policy: mockNotificationPromptPolicy(),
      },
    );

    expect(decision).toMatchObject({ kind: "skip", reason: "fully_opted_in" });
  });

  it("skips when the configured reprompt delay has not elapsed", () => {
    const decision = evaluateAfterActionTrigger(
      {
        source: "send",
        permissionStatus: "denied",
        areNotificationsAllowed: false,
        transactionsAlertsCategory: false,
        history: mockNotificationPromptHistory({
          dismissedPromptAtListByTarget: {
            globalPushNotifications: [ONE_DAY_BEFORE_NOW],
          },
        }),
      },
      {
        ...idleContext,
        policy: mockNotificationPromptPolicy({
          actionEvents: { send: { enabled: true, timer: 0 } },
          repromptSchedule: [{ days: 7 }],
        }),
      },
    );

    expect(decision).toMatchObject({
      kind: "skip",
      reason: "reprompt_delay_not_reached",
      dismissedCount: 1,
      nextRepromptDelay: { days: 7 },
    });
  });

  it("shows again when the configured reprompt delay has elapsed", () => {
    const decision = evaluateAfterActionTrigger(
      {
        source: "send",
        permissionStatus: "denied",
        areNotificationsAllowed: false,
        transactionsAlertsCategory: false,
        history: mockNotificationPromptHistory({
          dismissedPromptAtListByTarget: {
            globalPushNotifications: [Date.UTC(2026, 0, 1)],
          },
        }),
      },
      {
        ...idleContext,
        policy: mockNotificationPromptPolicy({
          actionEvents: { send: { enabled: true, timer: 0 } },
          repromptSchedule: [{ days: 7 }],
        }),
      },
    );

    expect(decision).toMatchObject({
      kind: "show",
      drawerPromptTarget: "globalPushNotifications",
      dismissedCount: 1,
      nextRepromptDelay: { days: 7 },
    });
  });

  it("keeps variant A limited to onboarding triggers", () => {
    const decision = evaluateAfterActionTrigger(
      {
        source: "send",
        permissionStatus: "denied",
        areNotificationsAllowed: false,
        transactionsAlertsCategory: false,
        history: mockNotificationPromptHistory(),
      },
      {
        ...idleContext,
        policy: mockNotificationPromptPolicy({ variant: "A" }),
      },
    );

    expect(decision).toMatchObject({ kind: "skip", reason: "variant_a_only_onboarding" });
  });
});

describe("reprompt helpers", () => {
  it("returns the next reprompt delay for the active prompt target", () => {
    expect(
      getNextRepromptDelay({
        permissionStatus: "denied",
        areNotificationsAllowed: false,
        transactionsAlertsCategory: false,
        history: mockNotificationPromptHistory({
          dismissedPromptAtListByTarget: {
            globalPushNotifications: [1, 2],
          },
        }),
        repromptSchedule: [{ days: 7 }, { days: 14 }],
      }),
    ).toEqual({ days: 14 });
  });

  it("preserves the legacy global opt-in helper behavior", () => {
    expect(
      shouldPromptOptInDrawerAfterAction({
        permissionStatus: "denied",
        areNotificationsAllowed: false,
        transactionsAlertsCategory: false,
        history: mockNotificationPromptHistory({
          dismissedPromptAtListByTarget: {
            globalPushNotifications: [Date.UTC(2026, 0, 1)],
          },
        }),
        repromptSchedule: [{ days: 7 }],
        now: NOW,
      }),
    ).toBe(true);
  });
});

describe("evaluateInactivityTrigger", () => {
  it("shows the inactivity prompt when the user is inactive and not globally opted in", () => {
    const decision = evaluateInactivityTrigger(
      {
        permissionStatus: "denied",
        areNotificationsAllowed: false,
        history: mockNotificationPromptHistory({ lastActionAt: Date.UTC(2025, 6, 1) }),
        hasCompletedOnboarding: true,
      },
      {
        ...idleContext,
        policy: mockNotificationPromptPolicy({
          inactivityEnabled: true,
          inactivityReprompt: { months: 6 },
        }),
      },
    );

    expect(decision).toMatchObject({
      kind: "show",
      delayMs: INACTIVITY_DRAWER_DELAY_MS,
      drawerPromptTarget: "globalPushNotifications",
    });
  });

  it("skips inactivity prompts for variant A", () => {
    const decision = evaluateInactivityTrigger(
      {
        permissionStatus: "denied",
        areNotificationsAllowed: false,
        history: mockNotificationPromptHistory({ lastActionAt: Date.UTC(2025, 6, 1) }),
        hasCompletedOnboarding: true,
      },
      {
        ...idleContext,
        policy: mockNotificationPromptPolicy({ variant: "A" }),
      },
    );

    expect(decision).toMatchObject({ kind: "skip", reason: "variant_a_inactivity_disabled" });
  });

  it("uses the normalized duration to determine inactivity", () => {
    expect(
      checkIsInactive({
        inactivityEnabled: true,
        inactivityReprompt: { days: 7 },
        lastActionAt: Date.UTC(2026, 0, 1),
        now: NOW,
      }),
    ).toBe(true);
  });
});
