import { sub } from "date-fns";
import { AuthorizationStatus } from "@react-native-firebase/messaging";
import type { Features } from "@shared/feature-flags";
import {
  evaluateAfterActionTrigger,
  evaluateInactivityTrigger,
} from "../notificationsPromptEngine";
import {
  FAST_QA_DELAY,
  buildActionEventToggleOverride,
  buildAfterActionTrace,
  buildFastQaFeatureOverride,
  buildInactiveUserData,
  buildInactivityTrace,
  buildRepromptableUserData,
  buildTransactionsAlertsPromptToggleOverride,
  buildTruncatedDismissalsUserData,
  formatTimestamp,
  getDismissalsForTarget,
  getInactivityRepromptTiming,
  getRepromptTiming,
} from "../notificationsPromptDebug";

type BrazePushNotifications = Features["brazePushNotifications"];
type BrazeParams = NonNullable<BrazePushNotifications["params"]>;

const NOW = new Date("2026-01-01T00:00:00.000Z").getTime();
const WEEK: BrazeParams["reprompt_schedule"][number] = {
  months: 0,
  days: 7,
  hours: 0,
  minutes: 0,
  seconds: 0,
};

const defaultParams: BrazeParams = {
  reprompt_schedule: [WEEK],
  action_events: {
    complete_onboarding: { enabled: true, timer: 0 },
    send: { enabled: true, timer: 0 },
    dapp_complete: { enabled: true, timer: 0 },
    receive: { enabled: true, timer: 0 },
    buy: { enabled: true, timer: 0 },
    swap: { enabled: true, timer: 0 },
    stake: { enabled: true, timer: 0 },
    add_favorite_coin: { enabled: true, timer: 0 },
  },
  inactivity_enabled: true,
  inactivity_reprompt: { months: 6, days: 0, hours: 0, minutes: 0, seconds: 0 },
  notificationsCategories: [],
};

const createFeature = (overrides?: Partial<BrazeParams>): BrazePushNotifications =>
  ({ enabled: true, params: { ...defaultParams, ...overrides } }) as BrazePushNotifications;

describe("notificationsPromptDebug: timing math", () => {
  describe("getDismissalsForTarget", () => {
    it("falls back to the legacy list for globalPushNotifications", () => {
      expect(
        getDismissalsForTarget({ dismissedOptInDrawerAtList: [1, 2] }, "globalPushNotifications"),
      ).toEqual([1, 2]);
    });

    it("prefers the per-target list when present", () => {
      expect(
        getDismissalsForTarget(
          {
            dismissedOptInDrawerAtList: [1],
            dismissedPromptAtListByTarget: { globalPushNotifications: [2, 3] },
          },
          "globalPushNotifications",
        ),
      ).toEqual([2, 3]);
    });
  });

  describe("getRepromptTiming", () => {
    it("is eligible on the first prompt (no dismissals yet)", () => {
      expect(
        getRepromptTiming({ dismissals: undefined, repromptSchedule: [WEEK], now: NOW }),
      ).toEqual({
        state: "eligible",
        eligibleAt: null,
        startAt: null,
        remaining: "now (first prompt)",
      });
    });

    it("is exactly eligible at the boundary and reports startAt for the timeline", () => {
      const dismissedAt = NOW - 7 * 24 * 60 * 60 * 1000;
      const timing = getRepromptTiming({
        dismissals: [dismissedAt],
        repromptSchedule: [WEEK],
        now: NOW,
      });
      expect(timing.state).toBe("eligible");
      expect(timing.startAt).toBe(dismissedAt);
      expect(timing.eligibleAt).toBe(NOW);
    });

    it("is waiting one millisecond before the boundary", () => {
      const dismissedAt = NOW - 7 * 24 * 60 * 60 * 1000 + 1;
      expect(
        getRepromptTiming({ dismissals: [dismissedAt], repromptSchedule: [WEEK], now: NOW }).state,
      ).toBe("waiting");
    });

    it("reports a missing schedule", () => {
      expect(getRepromptTiming({ dismissals: [NOW], repromptSchedule: [], now: NOW }).state).toBe(
        "missing",
      );
    });
  });

  describe("getInactivityRepromptTiming", () => {
    it("reports disabled when inactivity is off", () => {
      expect(
        getInactivityRepromptTiming({
          inactivityEnabled: false,
          inactivityReprompt: WEEK,
          lastActionAt: NOW,
          now: NOW,
        }).state,
      ).toBe("disabled");
    });

    it("is exactly eligible at the boundary", () => {
      const lastActionAt = NOW - 7 * 24 * 60 * 60 * 1000;
      expect(
        getInactivityRepromptTiming({
          inactivityEnabled: true,
          inactivityReprompt: WEEK,
          lastActionAt,
          now: NOW,
        }).state,
      ).toBe("eligible");
    });

    // Regression: the real engine (checkIsInactive) only checks that inactivityReprompt is
    // truthy before handing it to date-fns' `add`, which treats missing keys as 0 — it never
    // requires all 5 duration keys. A partial delay (as reported by QA) must NOT be reported as
    // "missing" here, or the trace checklist ("configuration is present") and the cooldown line
    // ("schedule missing") visibly contradict each other.
    it("treats a partial delay (missing keys) as present, matching the engine's own leniency", () => {
      const partialWeek = { days: 7 } as BrazeParams["inactivity_reprompt"];
      const lastActionAt = NOW - 7 * 24 * 60 * 60 * 1000;
      const timing = getInactivityRepromptTiming({
        inactivityEnabled: true,
        inactivityReprompt: partialWeek,
        lastActionAt,
        now: NOW,
      });
      expect(timing.state).not.toBe("missing");
      expect(timing.state).toBe("eligible");
    });
  });

  describe("scenario builders round-trip through the real engine", () => {
    it("buildRepromptableUserData makes the after-action trigger show", () => {
      const feature = createFeature();
      const dataOfUser = buildRepromptableUserData(
        { dismissedOptInDrawerAtList: [NOW - 1000] },
        "globalPushNotifications",
        feature.params!.reprompt_schedule,
        NOW,
      );

      const decision = evaluateAfterActionTrigger(
        {
          source: "send",
          permissionStatus: AuthorizationStatus.NOT_DETERMINED,
          areNotificationsAllowed: false,
          transactionsAlertsCategory: false,
          pushNotificationsDataOfUser: dataOfUser,
        },
        {
          brazePushNotifications: feature,
          isRatingsModalOpen: false,
          isDrawerPending: false,
          now: NOW,
        },
      );

      expect(decision.kind).toBe("show");
    });

    it("buildInactiveUserData makes the inactivity trigger show", () => {
      const feature = createFeature();
      const dataOfUser = buildInactiveUserData(null, feature.params!.inactivity_reprompt, NOW);

      const decision = evaluateInactivityTrigger(
        {
          permissionStatus: AuthorizationStatus.NOT_DETERMINED,
          areNotificationsAllowed: false,
          pushNotificationsDataOfUser: dataOfUser,
          hasCompletedOnboarding: true,
        },
        {
          brazePushNotifications: feature,
          isRatingsModalOpen: false,
          isDrawerPending: false,
          now: NOW,
        },
      );

      expect(decision.kind).toBe("show");
    });

    it("buildTruncatedDismissalsUserData keeps only the requested count", () => {
      const result = buildTruncatedDismissalsUserData(
        { dismissedOptInDrawerAtList: [1, 2, 3] },
        "globalPushNotifications",
        1,
      );
      expect(result.dismissedOptInDrawerAtList).toEqual([1]);
      expect(result.dismissedPromptAtListByTarget?.globalPushNotifications).toEqual([1]);
    });
  });

  describe("formatTimestamp", () => {
    it("returns null for invalid input", () => {
      expect(formatTimestamp(NaN)).toBeNull();
    });

    it("formats a valid timestamp", () => {
      expect(formatTimestamp(NOW)?.iso).toBe("2026-01-01T00:00:00.000Z");
    });
  });
});

describe("notificationsPromptDebug: config overrides", () => {
  it("buildFastQaFeatureOverride enables every trigger with a 5-second cooldown", () => {
    const override = buildFastQaFeatureOverride(null);
    expect(override.enabled).toBe(true);
    expect(override.params?.reprompt_schedule).toEqual([FAST_QA_DELAY]);
    expect(override.params?.inactivity_reprompt).toEqual(FAST_QA_DELAY);
    expect(Object.values(override.params!.action_events).every(event => event.enabled)).toBe(true);
  });

  it("buildActionEventToggleOverride flips only the targeted source", () => {
    const feature = createFeature();
    const toggled = buildActionEventToggleOverride(feature, "send");
    expect(toggled.params?.action_events.send.enabled).toBe(false);
    expect(toggled.params?.action_events.receive.enabled).toBe(true);

    const toggledBack = buildActionEventToggleOverride(toggled, "send");
    expect(toggledBack.params?.action_events.send.enabled).toBe(true);
  });

  it("buildTransactionsAlertsPromptToggleOverride adds then removes a source", () => {
    const feature = createFeature();
    const withSend = buildTransactionsAlertsPromptToggleOverride(feature, "send");
    const category = withSend.params?.notificationsCategories.find(
      c => c.category === "transactionsAlertsCategory",
    );
    expect(category?.drawerPromptActions).toContain("send");
    expect(category?.drawerPromptEnabled).toBe(true);

    const withoutSend = buildTransactionsAlertsPromptToggleOverride(withSend, "send");
    const categoryAfter = withoutSend.params?.notificationsCategories.find(
      c => c.category === "transactionsAlertsCategory",
    );
    expect(categoryAfter?.drawerPromptActions).not.toContain("send");
    expect(categoryAfter?.drawerPromptEnabled).toBe(false);
  });
});

const assertSingleFailureAt = (steps: ReturnType<typeof buildAfterActionTrace>, id: string) => {
  const failing = steps.filter(step => step.status === "fail");
  expect(failing).toHaveLength(1);
  expect(failing[0].id).toBe(id);
  const failIndex = steps.findIndex(step => step.id === id);
  expect(steps.slice(0, failIndex).every(step => step.status === "pass")).toBe(true);
  expect(steps.slice(failIndex + 1).every(step => step.status === "pending")).toBe(true);
};

describe("notificationsPromptDebug: decision trace matches the real engine", () => {
  const baseContext = (feature: BrazePushNotifications) => ({
    brazePushNotifications: feature,
    isRatingsModalOpen: false,
    isDrawerPending: false,
    now: NOW,
  });

  it("marks every step as pass when the decision is show", () => {
    const feature = createFeature();
    const decision = evaluateAfterActionTrigger(
      {
        source: "send",
        permissionStatus: AuthorizationStatus.NOT_DETERMINED,
        areNotificationsAllowed: false,
        transactionsAlertsCategory: false,
        pushNotificationsDataOfUser: null,
      },
      baseContext(feature),
    );
    expect(decision.kind).toBe("show");

    const trace = buildAfterActionTrace(decision, {
      globallyOptedIn: false,
      hasActionEventsConfig: true,
      hasActionEventForSource: true,
    });
    expect(trace.every(step => step.status === "pass")).toBe(true);
  });

  it("stops at feature_enabled when the flag is disabled", () => {
    const feature = createFeature();
    feature.enabled = false;
    const decision = evaluateAfterActionTrigger(
      {
        source: "send",
        permissionStatus: AuthorizationStatus.NOT_DETERMINED,
        areNotificationsAllowed: false,
        transactionsAlertsCategory: false,
        pushNotificationsDataOfUser: null,
      },
      baseContext(feature),
    );
    expect(decision).toMatchObject({ kind: "skip", reason: "feature_disabled" });

    const trace = buildAfterActionTrace(decision, {
      globallyOptedIn: false,
      hasActionEventsConfig: true,
      hasActionEventForSource: true,
    });
    assertSingleFailureAt(trace, "feature_enabled");
  });

  it("stops at action_event_enabled when the action event is disabled", () => {
    const feature = createFeature({
      action_events: { ...defaultParams.action_events, send: { enabled: false, timer: 0 } },
    });
    const decision = evaluateAfterActionTrigger(
      {
        source: "send",
        permissionStatus: AuthorizationStatus.NOT_DETERMINED,
        areNotificationsAllowed: false,
        transactionsAlertsCategory: false,
        pushNotificationsDataOfUser: null,
      },
      baseContext(feature),
    );
    expect(decision).toMatchObject({ kind: "skip", reason: "action_event_disabled" });

    const trace = buildAfterActionTrace(decision, {
      globallyOptedIn: false,
      hasActionEventsConfig: true,
      hasActionEventForSource: true,
    });
    assertSingleFailureAt(trace, "action_event_enabled");
  });

  it("stops at cooldown_elapsed when the reprompt delay has not been reached", () => {
    const feature = createFeature();
    const decision = evaluateAfterActionTrigger(
      {
        source: "send",
        permissionStatus: AuthorizationStatus.NOT_DETERMINED,
        areNotificationsAllowed: false,
        transactionsAlertsCategory: false,
        pushNotificationsDataOfUser: { dismissedOptInDrawerAtList: [NOW] },
      },
      baseContext(feature),
    );
    expect(decision).toMatchObject({ kind: "skip", reason: "reprompt_delay_not_reached" });

    const trace = buildAfterActionTrace(decision, {
      globallyOptedIn: false,
      hasActionEventsConfig: true,
      hasActionEventForSource: true,
    });
    assertSingleFailureAt(trace, "cooldown_elapsed");
  });

  it("stops at not_fully_opted_in when transaction alerts are already enabled", () => {
    const feature = createFeature();
    const decision = evaluateAfterActionTrigger(
      {
        source: "send",
        permissionStatus: AuthorizationStatus.AUTHORIZED,
        areNotificationsAllowed: true,
        transactionsAlertsCategory: true,
        pushNotificationsDataOfUser: null,
      },
      baseContext(feature),
    );
    expect(decision).toMatchObject({ kind: "skip", reason: "fully_opted_in" });

    const trace = buildAfterActionTrace(decision, {
      globallyOptedIn: true,
      hasActionEventsConfig: true,
      hasActionEventForSource: true,
    });
    assertSingleFailureAt(trace, "not_fully_opted_in");
  });

  it("stops at transactions_alerts_eligible when the category isn't configured for this source", () => {
    const feature = createFeature();
    const decision = evaluateAfterActionTrigger(
      {
        source: "send",
        permissionStatus: AuthorizationStatus.AUTHORIZED,
        areNotificationsAllowed: true,
        transactionsAlertsCategory: false,
        pushNotificationsDataOfUser: null,
      },
      baseContext(feature),
    );
    expect(decision).toMatchObject({ kind: "skip", reason: "transactions_alerts_not_eligible" });

    const trace = buildAfterActionTrace(decision, {
      globallyOptedIn: true,
      hasActionEventsConfig: true,
      hasActionEventForSource: true,
    });
    assertSingleFailureAt(trace, "transactions_alerts_eligible");
  });

  it("disambiguates configuration_missing to config_present when action_events is absent", () => {
    const feature = createFeature();
    feature.params = { ...feature.params, action_events: undefined } as unknown as BrazeParams;
    const decision = evaluateAfterActionTrigger(
      {
        source: "send",
        permissionStatus: AuthorizationStatus.NOT_DETERMINED,
        areNotificationsAllowed: false,
        transactionsAlertsCategory: false,
        pushNotificationsDataOfUser: null,
      },
      baseContext(feature),
    );
    expect(decision).toMatchObject({ kind: "skip", reason: "configuration_missing" });

    const trace = buildAfterActionTrace(decision, {
      globallyOptedIn: false,
      hasActionEventsConfig: false,
      hasActionEventForSource: false,
    });
    assertSingleFailureAt(trace, "config_present");
  });

  it("inactivity trace disambiguates feature_disabled between the master flag and inactivity_enabled", () => {
    const feature = createFeature({ inactivity_enabled: false });
    const decision = evaluateInactivityTrigger(
      {
        permissionStatus: AuthorizationStatus.NOT_DETERMINED,
        areNotificationsAllowed: false,
        pushNotificationsDataOfUser: null,
        hasCompletedOnboarding: true,
      },
      baseContext(feature),
    );
    expect(decision).toMatchObject({ kind: "skip", reason: "feature_disabled" });

    const trace = buildInactivityTrace(decision, { isFeatureEnabled: true });
    assertSingleFailureAt(trace, "inactivity_enabled_flag");
  });

  it("inactivity trace shows all-pass on a show decision", () => {
    const feature = createFeature();
    const decision = evaluateInactivityTrigger(
      {
        permissionStatus: AuthorizationStatus.NOT_DETERMINED,
        areNotificationsAllowed: false,
        pushNotificationsDataOfUser: {
          lastActionAt: sub(NOW, defaultParams.inactivity_reprompt).getTime(),
        },
        hasCompletedOnboarding: true,
      },
      baseContext(feature),
    );
    expect(decision.kind).toBe("show");

    const trace = buildInactivityTrace(decision, { isFeatureEnabled: true });
    expect(trace.every(step => step.status === "pass")).toBe(true);
  });
});
