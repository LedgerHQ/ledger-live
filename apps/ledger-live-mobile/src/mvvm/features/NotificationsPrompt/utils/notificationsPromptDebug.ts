import { add, sub } from "date-fns";
import type { Features } from "@shared/feature-flags";
import {
  type AfterActionTriggerDecision,
  type DataOfUser,
  type InactivityTriggerDecision,
  type NotificationPromptTarget,
  type NotificationsPromptAfterActionSource,
  type NotificationsPromptRepromptDelay,
} from "LLM/features/NotificationsPrompt";

type RepromptTimingState = "eligible" | "waiting" | "missing" | "disabled" | "invalid";

export type RepromptTiming = {
  state: RepromptTimingState;
  eligibleAt: number | null;
  /** Start of the cooldown window (last dismissal / last action). Null when there's nothing to plot. */
  startAt: number | null;
  remaining: string;
};

const durationKeys = ["months", "days", "hours", "minutes", "seconds"] as const;

// The real engine (`checkIsInactive`/`hasRepromptDelayElapsed`) only checks truthiness before
// handing the delay straight to date-fns' `add` (which treats missing keys as 0) — it never
// requires all 5 keys to be set. Mirror that leniency here: only reject keys that are actually
// present but garbage (non-finite/negative). Requiring full completeness previously made this
// timing helper report "missing" for delays the engine (and its decision trace) already treats
// as present, which made the trace checklist and the cooldown line visibly disagree.
const isValidDelay = (
  delay: NotificationsPromptRepromptDelay | null | undefined,
): delay is NotificationsPromptRepromptDelay =>
  Boolean(
    delay &&
    durationKeys.every(
      key => delay[key] === undefined || (Number.isFinite(delay[key]) && delay[key] >= 0),
    ),
  );

const isValidTimestamp = (timestamp: number | undefined): timestamp is number =>
  timestamp !== undefined &&
  Number.isFinite(timestamp) &&
  Number.isFinite(new Date(timestamp).getTime());

const formatDuration = (durationMs: number): string => {
  if (durationMs < 1000) {
    return "<1 second";
  }

  const units = [
    { label: "day", milliseconds: 24 * 60 * 60 * 1000 },
    { label: "hour", milliseconds: 60 * 60 * 1000 },
    { label: "minute", milliseconds: 60 * 1000 },
    { label: "second", milliseconds: 1000 },
  ];
  const parts: string[] = [];
  let remainingMs = durationMs;

  for (const { label, milliseconds } of units) {
    const value = Math.floor(remainingMs / milliseconds);
    if (value > 0) {
      parts.push(`${value} ${label}${value === 1 ? "" : "s"}`);
      remainingMs -= value * milliseconds;
    }
    if (parts.length === 2) {
      break;
    }
  }

  return parts.join(" ");
};

const buildTiming = (startAt: number, eligibleAt: number, now: number): RepromptTiming => {
  if (eligibleAt <= now) {
    return {
      state: "eligible",
      eligibleAt,
      startAt,
      remaining:
        eligibleAt === now ? "now" : `now (overdue by ${formatDuration(now - eligibleAt)})`,
    };
  }

  return {
    state: "waiting",
    eligibleAt,
    startAt,
    remaining: `in ${formatDuration(eligibleAt - now)}`,
  };
};

export const getDismissalsForTarget = (
  pushNotificationsDataOfUser: DataOfUser | null | undefined,
  promptTarget: NotificationPromptTarget,
): number[] | undefined => {
  const targetDismissals =
    pushNotificationsDataOfUser?.dismissedPromptAtListByTarget?.[promptTarget];

  if (promptTarget === "globalPushNotifications") {
    return targetDismissals ?? pushNotificationsDataOfUser?.dismissedOptInDrawerAtList;
  }

  return targetDismissals;
};

export const getRepromptTiming = ({
  dismissals,
  repromptSchedule,
  now,
}: {
  dismissals: number[] | undefined;
  repromptSchedule: NotificationsPromptRepromptDelay[] | null | undefined;
  now: number;
}): RepromptTiming => {
  if (!dismissals?.length) {
    return { state: "eligible", eligibleAt: null, startAt: null, remaining: "now (first prompt)" };
  }

  if (!repromptSchedule?.length) {
    return {
      state: "missing",
      eligibleAt: null,
      startAt: null,
      remaining: "reprompt schedule missing",
    };
  }

  const lastDismissedAt = dismissals.at(-1);
  if (!isValidTimestamp(lastDismissedAt)) {
    return {
      state: "invalid",
      eligibleAt: null,
      startAt: null,
      remaining: "latest dismissal timestamp invalid",
    };
  }

  const scheduleIndex = Math.min(dismissals.length - 1, repromptSchedule.length - 1);
  const delay = repromptSchedule[scheduleIndex];
  if (!isValidDelay(delay)) {
    return {
      state: "invalid",
      eligibleAt: null,
      startAt: null,
      remaining: "reprompt schedule invalid",
    };
  }

  const eligibleAt = add(lastDismissedAt, delay).getTime();
  if (!isValidTimestamp(eligibleAt)) {
    return {
      state: "invalid",
      eligibleAt: null,
      startAt: null,
      remaining: "next eligible timestamp invalid",
    };
  }

  return buildTiming(lastDismissedAt, eligibleAt, now);
};

export const getInactivityRepromptTiming = ({
  inactivityEnabled,
  inactivityReprompt,
  lastActionAt,
  now,
}: {
  inactivityEnabled: boolean | undefined;
  inactivityReprompt: NotificationsPromptRepromptDelay | null | undefined;
  lastActionAt: number | undefined;
  now: number;
}): RepromptTiming => {
  if (!inactivityEnabled) {
    return {
      state: "disabled",
      eligibleAt: null,
      startAt: null,
      remaining: "inactivity reprompt disabled",
    };
  }

  if (!isValidDelay(inactivityReprompt)) {
    return {
      state: "missing",
      eligibleAt: null,
      startAt: null,
      remaining: "inactivity schedule missing",
    };
  }

  if (lastActionAt === undefined) {
    return {
      state: "missing",
      eligibleAt: null,
      startAt: null,
      remaining: "last action timestamp missing",
    };
  }

  if (!isValidTimestamp(lastActionAt)) {
    return {
      state: "invalid",
      eligibleAt: null,
      startAt: null,
      remaining: "last action timestamp invalid",
    };
  }

  const eligibleAt = add(lastActionAt, inactivityReprompt).getTime();
  if (!isValidTimestamp(eligibleAt)) {
    return {
      state: "invalid",
      eligibleAt: null,
      startAt: null,
      remaining: "next eligible timestamp invalid",
    };
  }

  return buildTiming(lastActionAt, eligibleAt, now);
};

const withDismissalsForTarget = (
  pushNotificationsDataOfUser: DataOfUser | null | undefined,
  promptTarget: NotificationPromptTarget,
  dismissals: number[],
): DataOfUser => ({
  ...pushNotificationsDataOfUser,
  ...(promptTarget === "globalPushNotifications" ? { dismissedOptInDrawerAtList: dismissals } : {}),
  dismissedPromptAtListByTarget: {
    ...pushNotificationsDataOfUser?.dismissedPromptAtListByTarget,
    [promptTarget]: dismissals,
  },
});

export const buildRepromptableUserData = (
  pushNotificationsDataOfUser: DataOfUser | null | undefined,
  promptTarget: NotificationPromptTarget,
  repromptSchedule: NotificationsPromptRepromptDelay[] | null | undefined,
  now: number,
): DataOfUser | null => {
  const dismissals = [...(getDismissalsForTarget(pushNotificationsDataOfUser, promptTarget) ?? [])];
  if (!dismissals.length || !repromptSchedule?.length) {
    return null;
  }

  const scheduleIndex = Math.min(dismissals.length - 1, repromptSchedule.length - 1);
  const delay = repromptSchedule[scheduleIndex];
  if (!isValidDelay(delay)) {
    return null;
  }

  const repromptableDismissalAt = sub(now, delay).getTime();
  if (!isValidTimestamp(repromptableDismissalAt)) {
    return null;
  }

  dismissals[dismissals.length - 1] = repromptableDismissalAt;
  return withDismissalsForTarget(pushNotificationsDataOfUser, promptTarget, dismissals);
};

export const buildInactiveUserData = (
  pushNotificationsDataOfUser: DataOfUser | null | undefined,
  inactivityReprompt: NotificationsPromptRepromptDelay | null | undefined,
  now: number,
): DataOfUser | null => {
  if (!isValidDelay(inactivityReprompt)) {
    return null;
  }

  const lastActionAt = sub(now, inactivityReprompt).getTime();
  if (!isValidTimestamp(lastActionAt)) {
    return null;
  }

  return { ...pushNotificationsDataOfUser, lastActionAt };
};

export const buildTruncatedDismissalsUserData = (
  pushNotificationsDataOfUser: DataOfUser | null | undefined,
  promptTarget: NotificationPromptTarget,
  keepCount: number,
): DataOfUser =>
  withDismissalsForTarget(
    pushNotificationsDataOfUser,
    promptTarget,
    (getDismissalsForTarget(pushNotificationsDataOfUser, promptTarget) ?? []).slice(0, keepCount),
  );

export const formatTimestamp = (
  timestamp: number,
): { epochMs: string; iso: string; local: string } | null => {
  if (!isValidTimestamp(timestamp)) {
    return null;
  }

  const date = new Date(timestamp);
  return { epochMs: String(timestamp), iso: date.toISOString(), local: date.toLocaleString() };
};

export const FAST_QA_DELAY: NotificationsPromptRepromptDelay = {
  months: 0,
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 5,
};

type BrazePushNotificationsFeature = Features["brazePushNotifications"];
type BrazeParams = NonNullable<BrazePushNotificationsFeature["params"]>;

const actionEventKeyBySource = {
  onboarding: "complete_onboarding",
  send: "send",
  dapp_complete: "dapp_complete",
  receive: "receive",
  swap: "swap",
  stake: "stake",
  add_favorite_coin: "add_favorite_coin",
} as const satisfies Record<
  NotificationsPromptAfterActionSource,
  keyof BrazeParams["action_events"]
>;

export const getActionEventKey = (source: NotificationsPromptAfterActionSource) =>
  actionEventKeyBySource[source];

const DEFAULT_ACTION_EVENTS: BrazeParams["action_events"] = {
  complete_onboarding: { enabled: true, timer: 0 },
  send: { enabled: true, timer: 0 },
  dapp_complete: { enabled: true, timer: 0 },
  receive: { enabled: true, timer: 0 },
  buy: { enabled: true, timer: 0 },
  swap: { enabled: true, timer: 0 },
  stake: { enabled: true, timer: 0 },
  add_favorite_coin: { enabled: true, timer: 0 },
};

export const buildFastQaFeatureOverride = (
  current: BrazePushNotificationsFeature | null | undefined,
): BrazePushNotificationsFeature => ({
  ...current,
  enabled: true,
  params: {
    reprompt_schedule: [FAST_QA_DELAY],
    inactivity_enabled: true,
    inactivity_reprompt: FAST_QA_DELAY,
    action_events: DEFAULT_ACTION_EVENTS,
    notificationsCategories: [
      {
        displayed: true,
        category: "transactionsAlertsCategory",
        drawerPromptEnabled: true,
        drawerPromptActions: [
          "onboarding",
          "send",
          "dapp_complete",
          "receive",
          "swap",
          "stake",
          "add_favorite_coin",
        ],
      },
    ],
  },
});

const withDefaultParams = (
  current: BrazePushNotificationsFeature | null | undefined,
): BrazeParams => ({
  reprompt_schedule: current?.params?.reprompt_schedule ?? [FAST_QA_DELAY],
  inactivity_enabled: current?.params?.inactivity_enabled ?? true,
  inactivity_reprompt: current?.params?.inactivity_reprompt ?? FAST_QA_DELAY,
  action_events: current?.params?.action_events ?? DEFAULT_ACTION_EVENTS,
  notificationsCategories: current?.params?.notificationsCategories ?? [],
});

export const buildActionEventToggleOverride = (
  current: BrazePushNotificationsFeature | null | undefined,
  source: NotificationsPromptAfterActionSource,
): BrazePushNotificationsFeature => {
  const key = getActionEventKey(source);
  const params = withDefaultParams(current);
  const currentEvent = params.action_events[key];
  return {
    ...current,
    enabled: current?.enabled ?? false,
    params: {
      ...params,
      action_events: {
        ...params.action_events,
        [key]: { enabled: !currentEvent?.enabled, timer: currentEvent?.timer ?? 0 },
      },
    },
  };
};

// --- Decision trace ---------------------------------------------------------
// Maps the engine's authoritative `decision.reason` to a fixed, ordered list of
// steps mirroring the checks `evaluateAfterActionTrigger`/`evaluateInactivityTrigger`
// perform internally. Steps before the failing one are marked "pass" (the engine
// got that far), the matching step is "fail", and everything after is "pending"
// (the engine never got there). On a "show" decision every step is "pass".
// Kept in sync with the engine via the round-trip tests in this file's test suite.

export type TraceStepStatus = "pass" | "fail" | "pending";

export type TraceStep = {
  id: string;
  label: string;
  status: TraceStepStatus;
};

const buildTraceFromFailingStep = (
  steps: ReadonlyArray<{ id: string; label: string }>,
  failingStepId: string | null,
): TraceStep[] => {
  const failIndex =
    failingStepId === null ? -1 : steps.findIndex(step => step.id === failingStepId);

  return steps.map((step, index) => ({
    ...step,
    status:
      failIndex === -1 || index < failIndex ? "pass" : index === failIndex ? "fail" : "pending",
  }));
};

const AFTER_ACTION_TRACE_STEPS: ReadonlyArray<{ id: string; label: string }> = [
  { id: "feature_enabled", label: "brazePushNotifications is enabled" },
  { id: "config_present", label: "action_events configuration is present for this source" },
  { id: "ratings_modal_clear", label: "Ratings modal is not currently open" },
  { id: "drawer_not_pending", label: "No other drawer is already open or scheduled" },
  { id: "action_event_enabled", label: "This action's event is enabled" },
  { id: "cooldown_elapsed", label: "Reprompt cooldown has elapsed" },
  { id: "not_fully_opted_in", label: "Not already fully opted in" },
  {
    id: "transactions_alerts_eligible",
    label: "Transaction alerts are configured to prompt for this action",
  },
];

export const buildAfterActionTrace = (
  decision: AfterActionTriggerDecision,
  context: {
    globallyOptedIn: boolean;
    hasActionEventsConfig: boolean;
    hasActionEventForSource: boolean;
  },
): TraceStep[] => {
  if (decision.kind === "show") {
    return buildTraceFromFailingStep(AFTER_ACTION_TRACE_STEPS, null);
  }

  const failingStepId = ((): string | null => {
    switch (decision.reason) {
      case "feature_disabled":
        return "feature_enabled";
      case "configuration_missing":
        // Same reason covers "action_events missing entirely" and "this source has
        // no action_events entry"; anything else falling through here means the
        // reprompt schedule itself is misconfigured.
        return !context.hasActionEventsConfig || !context.hasActionEventForSource
          ? "config_present"
          : "cooldown_elapsed";
      case "ratings_modal_open":
        return "ratings_modal_clear";
      case "drawer_already_pending":
        return "drawer_not_pending";
      case "action_event_disabled":
        return "action_event_enabled";
      case "reprompt_delay_not_reached":
        return "cooldown_elapsed";
      case "fully_opted_in":
        return "not_fully_opted_in";
      case "transactions_alerts_not_eligible":
        return "transactions_alerts_eligible";
      default:
        return null;
    }
  })();

  return buildTraceFromFailingStep(AFTER_ACTION_TRACE_STEPS, failingStepId);
};

const INACTIVITY_TRACE_STEPS: ReadonlyArray<{ id: string; label: string }> = [
  { id: "feature_enabled", label: "brazePushNotifications is enabled" },
  { id: "ratings_modal_clear", label: "Ratings modal is not currently open" },
  { id: "drawer_not_pending", label: "No other drawer is already open or scheduled" },
  { id: "onboarding_complete", label: "Onboarding is complete" },
  { id: "inactivity_schedule_present", label: "inactivity_reprompt configuration is present" },
  { id: "inactivity_enabled_flag", label: "inactivity_enabled is true" },
  { id: "not_globally_opted_in", label: "Not already globally opted in" },
  { id: "user_inactive", label: "User has been inactive long enough" },
];

export const buildInactivityTrace = (
  decision: InactivityTriggerDecision,
  context: { isFeatureEnabled: boolean },
): TraceStep[] => {
  if (decision.kind === "show") {
    return buildTraceFromFailingStep(INACTIVITY_TRACE_STEPS, null);
  }

  const failingStepId = ((): string | null => {
    switch (decision.reason) {
      case "feature_disabled":
        // Same reason covers the master flag and the inactivity-specific sub-flag.
        return context.isFeatureEnabled ? "inactivity_enabled_flag" : "feature_enabled";
      case "ratings_modal_open":
        return "ratings_modal_clear";
      case "drawer_already_pending":
        return "drawer_not_pending";
      case "onboarding_incomplete":
        return "onboarding_complete";
      case "configuration_missing":
        return "inactivity_schedule_present";
      case "globally_opted_in_no_inactivity_drawer":
        return "not_globally_opted_in";
      case "user_not_inactive":
        return "user_inactive";
      default:
        return null;
    }
  })();

  return buildTraceFromFailingStep(INACTIVITY_TRACE_STEPS, failingStepId);
};

export const buildTransactionsAlertsPromptToggleOverride = (
  current: BrazePushNotificationsFeature | null | undefined,
  source: NotificationsPromptAfterActionSource,
): BrazePushNotificationsFeature => {
  const params = withDefaultParams(current);
  const existing = params.notificationsCategories.find(
    category => category.category === "transactionsAlertsCategory",
  );
  const currentActions = existing?.drawerPromptActions ?? [];
  const nextActions = currentActions.includes(source)
    ? currentActions.filter(action => action !== source)
    : [...currentActions, source];

  return {
    ...current,
    enabled: current?.enabled ?? false,
    params: {
      ...params,
      notificationsCategories: [
        ...params.notificationsCategories.filter(
          category => category.category !== "transactionsAlertsCategory",
        ),
        {
          displayed: existing?.displayed ?? true,
          category: "transactionsAlertsCategory",
          drawerPromptEnabled: nextActions.length > 0,
          drawerPromptActions: nextActions,
        },
      ],
    },
  };
};
