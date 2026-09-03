import { add, sub } from "date-fns";
import { AuthorizationStatus } from "@react-native-firebase/messaging";
import type { Features } from "@shared/feature-flags";
import type {
  AfterActionTriggerDecision,
  DataOfUser,
  InactivityTriggerDecision,
  NotificationPromptTarget,
  NotificationsPromptAfterActionSource,
  NotificationsPromptRepromptDelay,
  NotificationsPromptSkipReason,
} from "LLM/features/NotificationsPrompt";
import type { QaInspectorField, QaInspectorFieldTone } from "LLM/components/QaInspectorRow";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

type RepromptDuration = NotificationsPromptRepromptDelay;

export const getGlobalPushNotificationsDismissals = (
  pushNotificationsDataOfUser: DataOfUser | null | undefined,
): number[] | undefined => {
  const dismissedPromptAtListByTarget =
    pushNotificationsDataOfUser?.dismissedPromptAtListByTarget ?? {};

  return (
    dismissedPromptAtListByTarget.globalPushNotifications ??
    pushNotificationsDataOfUser?.dismissedOptInDrawerAtList
  );
};

const formatRepromptInDays = (targetMs: number, now: number): string => {
  if (targetMs <= now) {
    return "now (eligible)";
  }

  const remainingMs = targetMs - now;
  if (remainingMs < MS_PER_DAY) {
    return "in less than 1 day";
  }

  const days = Math.ceil(remainingMs / MS_PER_DAY);
  const dayLabel = days === 1 ? "day" : "days";
  return `in ${days} ${dayLabel}`;
};

export const formatDismissalTimestamp = (timestamp: number) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return {
      epochMs: String(timestamp),
      iso: "invalid",
      local: "invalid",
    };
  }

  return {
    epochMs: String(timestamp),
    iso: date.toISOString(),
    local: date.toLocaleString(),
  };
};

export const getAfterActionRepromptLabel = ({
  dismissedOptInDrawerAtList,
  repromptSchedule,
  now,
}: {
  dismissedOptInDrawerAtList: number[] | undefined;
  repromptSchedule: RepromptDuration[] | null | undefined;
  now: number;
}): string => {
  if (!dismissedOptInDrawerAtList?.length) {
    return "now (eligible)";
  }

  if (!repromptSchedule?.length) {
    return "not configured";
  }

  const scheduleIndex = Math.min(
    dismissedOptInDrawerAtList.length - 1,
    repromptSchedule.length - 1,
  );
  const nextRepromptDelay = repromptSchedule[scheduleIndex];
  const lastDismissedAt = dismissedOptInDrawerAtList.at(-1);
  if (lastDismissedAt === undefined) {
    return "now (eligible)";
  }

  return formatRepromptInDays(add(lastDismissedAt, nextRepromptDelay).getTime(), now);
};

export const getInactivityRepromptLabel = ({
  lastActionAt,
  inactivityReprompt,
  inactivityEnabled,
  now,
}: {
  lastActionAt: number | undefined;
  inactivityReprompt: RepromptDuration | null | undefined;
  inactivityEnabled: boolean | undefined;
  now: number;
}): string => {
  if (!inactivityEnabled) {
    return "disabled";
  }

  if (!inactivityReprompt) {
    return "not configured";
  }

  if (lastActionAt === undefined) {
    return "unknown (no lastActionAt)";
  }

  return formatRepromptInDays(add(lastActionAt, inactivityReprompt).getTime(), now);
};

/** Mirrors notificationsPromptEngine: add(timestamp, delay).getTime() <= now */
const getTimestampEligibleForDelay = (delay: RepromptDuration, now: number): number =>
  sub(now, delay).getTime();

const getRepromptDelayForDismissalCount = (
  repromptSchedule: RepromptDuration[] | null | undefined,
  dismissalCount: number,
): RepromptDuration => {
  const fallbackDelay: RepromptDuration = {
    days: 7,
    hours: 0,
    minutes: 0,
    months: 0,
    seconds: 0,
  };
  const schedule = repromptSchedule?.length ? repromptSchedule : [fallbackDelay];
  const scheduleIndex = Math.min(Math.max(dismissalCount, 1) - 1, schedule.length - 1);
  return schedule[scheduleIndex];
};

const getRepromptEligibleDismissalAt = (
  repromptSchedule: RepromptDuration[] | null | undefined,
  dismissalCount: number,
  now: number,
): number =>
  getTimestampEligibleForDelay(
    getRepromptDelayForDismissalCount(repromptSchedule, dismissalCount),
    now,
  );

export const buildRepromptableUserData = (
  pushNotificationsDataOfUser: DataOfUser | null | undefined,
  repromptSchedule: RepromptDuration[] | null | undefined,
  now: number,
): DataOfUser => {
  const dismissedOptInDrawerAtList = [
    ...(getGlobalPushNotificationsDismissals(pushNotificationsDataOfUser) ?? []),
  ];

  const dismissalCount = Math.max(dismissedOptInDrawerAtList.length, 1);
  const repromptableDismissalAt = getRepromptEligibleDismissalAt(
    repromptSchedule,
    dismissalCount,
    now,
  );

  if (!dismissedOptInDrawerAtList.length) {
    dismissedOptInDrawerAtList.push(repromptableDismissalAt);
  } else {
    dismissedOptInDrawerAtList[dismissedOptInDrawerAtList.length - 1] = repromptableDismissalAt;
  }

  return {
    ...pushNotificationsDataOfUser,
    dismissedOptInDrawerAtList,
    dismissedPromptAtListByTarget: {
      ...pushNotificationsDataOfUser?.dismissedPromptAtListByTarget,
      globalPushNotifications: dismissedOptInDrawerAtList,
    },
    lastActionAt: pushNotificationsDataOfUser?.lastActionAt ?? now,
  };
};

export const buildInactiveUserData = (
  pushNotificationsDataOfUser: DataOfUser | null | undefined,
  inactivityReprompt: RepromptDuration | null | undefined,
  now: number,
): DataOfUser => {
  const delay = inactivityReprompt ?? {
    months: 6,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  };

  const inactiveLastActionAt = getTimestampEligibleForDelay(delay, now);

  return {
    ...pushNotificationsDataOfUser,
    lastActionAt: inactiveLastActionAt,
  };
};

export const buildTruncatedDismissalsUserData = (
  pushNotificationsDataOfUser: DataOfUser | null | undefined,
  keepCount: number,
): DataOfUser => {
  const safeKeepCount = Math.max(0, Math.floor(keepCount));
  const dismissedOptInDrawerAtList = (
    getGlobalPushNotificationsDismissals(pushNotificationsDataOfUser) ?? []
  ).slice(0, safeKeepCount);

  return {
    ...pushNotificationsDataOfUser,
    dismissedOptInDrawerAtList,
    dismissedPromptAtListByTarget: {
      ...pushNotificationsDataOfUser?.dismissedPromptAtListByTarget,
      globalPushNotifications: dismissedOptInDrawerAtList,
    },
  };
};

export type NotificationsQaExpectation = "Show drawer" | "Skip" | "Blocked";
export type NotificationsQaTriggerSource = NotificationsPromptAfterActionSource | "inactivity";

export type NotificationsQaScenario = {
  id: string;
  name: string;
  summary: string;
  expected: NotificationsQaExpectation;
  source: NotificationsQaTriggerSource;
  permissionStatus: (typeof AuthorizationStatus)[keyof typeof AuthorizationStatus];
  areNotificationsAllowed: boolean;
  transactionsAlertsCategory: boolean;
  hasCompletedOnboarding: boolean;
  userData: "firstPrompt" | "alreadyOptedIn" | "tooSoon" | "eligibleAfterAction" | "inactive";
};

/** Opted-out user who already went through onboarding: the common QA starting point. */
const SCENARIO_DEFAULTS = {
  permissionStatus: AuthorizationStatus.DENIED,
  areNotificationsAllowed: false,
  transactionsAlertsCategory: false,
  hasCompletedOnboarding: true,
} satisfies Partial<NotificationsQaScenario>;

export const NOTIFICATIONS_QA_SCENARIOS: NotificationsQaScenario[] = [
  {
    ...SCENARIO_DEFAULTS,
    id: "first-prompt",
    name: "First prompt",
    summary: "No previous dismissal → drawer can show after onboarding",
    expected: "Show drawer",
    source: "onboarding",
    permissionStatus: AuthorizationStatus.NOT_DETERMINED,
    userData: "firstPrompt",
  },
  {
    ...SCENARIO_DEFAULTS,
    id: "already-opted-in",
    name: "Already opted in",
    summary: "OS, app and transaction alerts are on → skip",
    expected: "Skip",
    source: "send",
    permissionStatus: AuthorizationStatus.AUTHORIZED,
    areNotificationsAllowed: true,
    transactionsAlertsCategory: true,
    userData: "alreadyOptedIn",
  },
  {
    ...SCENARIO_DEFAULTS,
    id: "too-soon",
    name: "Too soon to ask again",
    summary: "A recent dismissal keeps the drawer inside its cooldown",
    expected: "Skip",
    source: "send",
    userData: "tooSoon",
  },
  {
    ...SCENARIO_DEFAULTS,
    id: "eligible-after-action",
    name: "Eligible after action",
    summary: "The dismissal cooldown has elapsed → drawer can show",
    expected: "Show drawer",
    source: "send",
    userData: "eligibleAfterAction",
  },
  {
    ...SCENARIO_DEFAULTS,
    id: "inactive-user",
    name: "Inactive user",
    summary: "The inactivity threshold has elapsed → drawer can show",
    expected: "Show drawer",
    source: "inactivity",
    userData: "inactive",
  },
];

export const NOTIFICATIONS_QA_GROUPS: NotificationsQaExpectation[] = ["Skip", "Show drawer"];

export const NOTIFICATIONS_QA_VERDICT_META: Record<
  NotificationsQaExpectation,
  { hint: string; tone: "success" | "warning" | "error" }
> = {
  "Show drawer": {
    hint: "Production eligibility says this drawer can be shown.",
    tone: "success",
  },
  Skip: {
    hint: "The current user state does not need a drawer.",
    tone: "warning",
  },
  Blocked: {
    hint: "A configuration or runtime gate prevents the drawer.",
    tone: "error",
  },
};

export const NOTIFICATIONS_PROMPT_REASON_LABEL: Record<NotificationsPromptSkipReason, string> = {
  feature_disabled: "Feature flag disabled",
  configuration_missing: "Configuration missing",
  ratings_modal_open: "Ratings modal is open",
  drawer_already_pending: "Drawer already pending",
  fully_opted_in: "Already opted in",
  reprompt_delay_not_reached: "Too soon to ask again",
  action_event_disabled: "This action does not trigger the prompt",
  transactions_alerts_not_eligible: "Transaction alerts not eligible for this action",
  onboarding_incomplete: "Onboarding incomplete",
  user_not_inactive: "User is still active",
  globally_opted_in_no_inactivity_drawer: "Already opted in — no inactivity prompt",
};

const BLOCKED_REASONS = new Set<NotificationsPromptSkipReason>([
  "feature_disabled",
  "configuration_missing",
  "ratings_modal_open",
  "drawer_already_pending",
  "onboarding_incomplete",
]);

export const mapNotificationsDecisionToQaExpectation = (
  decision: AfterActionTriggerDecision | InactivityTriggerDecision,
): NotificationsQaExpectation => {
  if (decision.kind === "show") {
    return "Show drawer";
  }

  return BLOCKED_REASONS.has(decision.reason) ? "Blocked" : "Skip";
};

export const buildNotificationsQaScenarioUserData = (
  scenario: NotificationsQaScenario,
  {
    repromptSchedule,
    inactivityReprompt,
    now,
  }: {
    repromptSchedule: NotificationsPromptRepromptDelay[] | null | undefined;
    inactivityReprompt: NotificationsPromptRepromptDelay | null | undefined;
    now: number;
  },
): DataOfUser => {
  switch (scenario.userData) {
    case "firstPrompt":
      return {
        dismissedOptInDrawerAtList: [],
        dismissedPromptAtListByTarget: { globalPushNotifications: [] },
        lastActionAt: now,
      };
    case "alreadyOptedIn":
      return { lastActionAt: now };
    case "tooSoon":
      return {
        dismissedOptInDrawerAtList: [now],
        dismissedPromptAtListByTarget: { globalPushNotifications: [now] },
        lastActionAt: now,
      };
    case "eligibleAfterAction":
      return buildRepromptableUserData(undefined, repromptSchedule, now);
    case "inactive":
      return buildInactiveUserData(undefined, inactivityReprompt, now);
  }
};

export const formatPermissionStatus = (
  status: (typeof AuthorizationStatus)[keyof typeof AuthorizationStatus] | null | undefined,
): string => {
  switch (status) {
    case AuthorizationStatus.AUTHORIZED:
      return "Authorized";
    case AuthorizationStatus.DENIED:
      return "Denied";
    case AuthorizationStatus.NOT_DETERMINED:
      return "Not determined";
    case AuthorizationStatus.PROVISIONAL:
      return "Provisional";
    case AuthorizationStatus.EPHEMERAL:
      return "Ephemeral";
    default:
      return "Unknown";
  }
};

export const TRIGGER_SOURCES: NotificationsQaTriggerSource[] = [
  "onboarding",
  "send",
  "receive",
  "swap",
  "stake",
  "add_favorite_coin",
  "inactivity",
];

export const SOURCE_LABEL: Record<NotificationsQaTriggerSource, string> = {
  onboarding: "Onboarding",
  send: "Send",
  receive: "Receive",
  swap: "Swap",
  stake: "Stake",
  add_favorite_coin: "Add favourite coin",
  dapp_complete: "DApp complete",
  inactivity: "Inactivity",
};

export type NotificationsQaInspectorFieldTone = QaInspectorFieldTone;
export type NotificationsQaInspectorField = QaInspectorField;

type BrazePushNotificationsFeature = Features["brazePushNotifications"] | null | undefined;

export function formatDelay(delay: Record<string, number> | null | undefined): string {
  if (!delay) return "Not configured";

  const parts = Object.entries(delay)
    .filter(([, value]) => value > 0)
    .map(([unit, value]) => `${value} ${unit}`);
  return parts.length > 0 ? parts.join(", ") : "Immediately";
}

export function getForceOpenDrawerLabel(target: NotificationPromptTarget): string {
  return `Force open ${target} drawer — bypass rules`;
}

export function getSelectedActionEvent(
  selectedSource: NotificationsQaTriggerSource,
  brazePushNotifications: BrazePushNotificationsFeature,
) {
  if (selectedSource === "inactivity") return undefined;
  const actionEventKey = selectedSource === "onboarding" ? "complete_onboarding" : selectedSource;
  return brazePushNotifications?.params?.action_events?.[actionEventKey];
}

export function getNotificationsQaHeadline(
  decision: AfterActionTriggerDecision | InactivityTriggerDecision,
): { verdict: NotificationsQaExpectation; reason: string; rawReason: string } {
  const verdict = mapNotificationsDecisionToQaExpectation(decision);
  return {
    verdict,
    reason:
      decision.kind === "show"
        ? "Eligible now"
        : NOTIFICATIONS_PROMPT_REASON_LABEL[decision.reason],
    rawReason: decision.kind === "show" ? "kind: show" : `reason: ${decision.reason}`,
  };
}

export function buildUserStateInspectorFields({
  permissionStatus,
  hasSimulatedPermission,
  areNotificationsAllowed,
  transactionsAlertsCategory,
  hasCompletedOnboarding,
  globalDismissals,
  lastActionAt,
}: {
  permissionStatus:
    | (typeof AuthorizationStatus)[keyof typeof AuthorizationStatus]
    | null
    | undefined;
  hasSimulatedPermission: boolean;
  areNotificationsAllowed: boolean;
  transactionsAlertsCategory: boolean;
  hasCompletedOnboarding: boolean;
  globalDismissals: number[] | undefined;
  lastActionAt: number | undefined;
}): NotificationsQaInspectorField[] {
  return [
    {
      label: "OS notification permission",
      value: formatPermissionStatus(permissionStatus),
      raw: `permissionStatus: ${String(permissionStatus)}${
        hasSimulatedPermission ? " · simulated until app foreground sync" : ""
      }`,
      status: {
        label: permissionStatus === AuthorizationStatus.AUTHORIZED ? "On" : "Off",
        tone: permissionStatus === AuthorizationStatus.AUTHORIZED ? "success" : "gray",
      },
    },
    {
      label: "App notifications",
      value: areNotificationsAllowed ? "Enabled" : "Disabled",
      raw: `areNotificationsAllowed: ${String(areNotificationsAllowed)}`,
      status: {
        label: areNotificationsAllowed ? "On" : "Off",
        tone: areNotificationsAllowed ? "success" : "gray",
      },
    },
    {
      label: "Transaction alerts",
      value: transactionsAlertsCategory ? "Enabled" : "Disabled",
      raw: `transactionsAlertsCategory: ${String(transactionsAlertsCategory)}`,
      status: {
        label: transactionsAlertsCategory ? "On" : "Off",
        tone: transactionsAlertsCategory ? "success" : "gray",
      },
    },
    {
      label: "Onboarding",
      value: hasCompletedOnboarding ? "Complete" : "Incomplete",
      raw: `hasCompletedOnboarding: ${String(hasCompletedOnboarding)}`,
      status: {
        label: hasCompletedOnboarding ? "Ready" : "Blocked",
        tone: hasCompletedOnboarding ? "success" : "error",
      },
    },
    {
      label: "Stored dismissals",
      value: `${globalDismissals?.length ?? 0} dismissal(s)`,
      raw: `globalPushNotifications: ${JSON.stringify(globalDismissals ?? [])}`,
      status: {
        label: globalDismissals?.length ? "Saved" : "Empty",
        tone: "gray",
      },
    },
    {
      label: "Last activity",
      value: lastActionAt ? formatDismissalTimestamp(lastActionAt).local : "Missing",
      raw: `lastActionAt: ${String(lastActionAt)}`,
      status: {
        label: lastActionAt ? "Saved" : "Missing",
        tone: "gray",
      },
    },
  ];
}

export function buildDecisionInspectorFields({
  selectedSource,
  decision,
  resolvedPromptTarget,
  verdictTone,
}: {
  selectedSource: NotificationsQaTriggerSource;
  decision: AfterActionTriggerDecision | InactivityTriggerDecision;
  resolvedPromptTarget: NotificationPromptTarget;
  verdictTone: NotificationsQaInspectorFieldTone;
}): NotificationsQaInspectorField[] {
  return [
    {
      label: "Selected trigger",
      value: SOURCE_LABEL[selectedSource],
      raw: `source: ${selectedSource}`,
      status: {
        label: decision.kind === "show" ? "Show" : "Skip",
        tone: verdictTone,
      },
    },
    {
      label: "Drawer target",
      value: resolvedPromptTarget,
      raw: `drawerPromptTarget: ${resolvedPromptTarget} · dismissedCount: ${decision.dismissedCount}`,
      status: { label: "Resolved", tone: "success" },
    },
  ];
}

export function buildFeatureInspectorFields({
  selectedSource,
  brazePushNotifications,
  afterActionRepromptLabel,
  inactivityRepromptLabel,
}: {
  selectedSource: NotificationsQaTriggerSource;
  brazePushNotifications: BrazePushNotificationsFeature;
  afterActionRepromptLabel: string;
  inactivityRepromptLabel: string;
}): NotificationsQaInspectorField[] {
  const selectedActionEvent = getSelectedActionEvent(selectedSource, brazePushNotifications);
  const inactivityField: NotificationsQaInspectorField = {
    label: "Inactivity prompt",
    value: brazePushNotifications?.params?.inactivity_enabled ? "Enabled" : "Disabled",
    raw: `inactivity_reprompt: ${formatDelay(brazePushNotifications?.params?.inactivity_reprompt)}`,
    status: {
      label: brazePushNotifications?.params?.inactivity_enabled ? "On" : "Off",
      tone: brazePushNotifications?.params?.inactivity_enabled ? "success" : "error",
    },
  };
  const actionField: NotificationsQaInspectorField = {
    label: `${SOURCE_LABEL[selectedSource]} action`,
    value: selectedActionEvent?.enabled ? "Enabled" : "Disabled",
    raw: `timer: ${selectedActionEvent?.timer ?? "missing"} ms`,
    status: {
      label: selectedActionEvent?.enabled ? "On" : "Off",
      tone: selectedActionEvent?.enabled ? "success" : "error",
    },
  };

  return [
    {
      label: "Braze notifications prompt",
      value: brazePushNotifications?.enabled ? "Enabled" : "Disabled",
      raw: "feature: brazePushNotifications",
      status: {
        label: brazePushNotifications?.enabled ? "On" : "Off",
        tone: brazePushNotifications?.enabled ? "success" : "error",
      },
    },
    selectedSource === "inactivity" ? inactivityField : actionField,
    {
      label: "After-action reprompt",
      value: afterActionRepromptLabel,
      raw: `reprompt_schedule: ${
        brazePushNotifications?.params?.reprompt_schedule?.length ?? 0
      } step(s)`,
      status: {
        label: afterActionRepromptLabel.includes("eligible") ? "Ready" : "Waiting",
        tone: afterActionRepromptLabel.includes("eligible") ? "success" : "warning",
      },
    },
    {
      label: "Inactivity reprompt",
      value: inactivityRepromptLabel,
      raw: `inactivity_reprompt: ${formatDelay(brazePushNotifications?.params?.inactivity_reprompt)}`,
      status: {
        label: inactivityRepromptLabel.includes("eligible") ? "Ready" : "Waiting",
        tone: inactivityRepromptLabel.includes("eligible") ? "success" : "warning",
      },
    },
  ];
}
