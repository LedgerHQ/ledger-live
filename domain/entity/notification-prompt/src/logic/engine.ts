import type {
  NotificationPermissionStatus,
  NotificationPromptAfterActionSource,
  NotificationPromptCategoryConfig,
  NotificationPromptDuration,
  NotificationPromptHistory,
  NotificationPromptPolicy,
  NotificationPromptSource,
  NotificationPromptTarget,
  NotificationPromptVariant,
  NotificationPromptActionEventKey,
} from "../data/schema";

export type NotificationsPromptRepromptDelay = NotificationPromptDuration;

export type NotificationsPromptSkipReason =
  | "feature_disabled"
  | "configuration_missing"
  | "ratings_modal_open"
  | "drawer_already_pending"
  | "fully_opted_in"
  | "reprompt_delay_not_reached"
  | "action_event_disabled"
  | "transactions_alerts_not_eligible"
  | "variant_a_only_onboarding"
  | "variant_a_inactivity_disabled"
  | "onboarding_incomplete"
  | "user_not_inactive"
  | "globally_opted_in_no_inactivity_drawer";

type NotificationsPromptDecisionBase<TSource extends NotificationPromptSource> = {
  source: TSource;
  dismissedCount: number;
  nextRepromptDelay: NotificationsPromptRepromptDelay | null;
  variant?: NotificationPromptVariant;
};

export type NotificationsPromptShowDecision<TSource extends NotificationPromptSource> =
  NotificationsPromptDecisionBase<TSource> & {
    kind: "show";
    delayMs: number;
    drawerPromptTarget: NotificationPromptTarget;
  };

export type NotificationsPromptSkipDecision<TSource extends NotificationPromptSource> =
  NotificationsPromptDecisionBase<TSource> & {
    kind: "skip";
    reason: NotificationsPromptSkipReason;
  };

export type AfterActionTriggerDecision =
  | NotificationsPromptShowDecision<NotificationPromptAfterActionSource>
  | NotificationsPromptSkipDecision<NotificationPromptAfterActionSource>;

export type InactivityTriggerDecision =
  | NotificationsPromptShowDecision<"inactivity">
  | NotificationsPromptSkipDecision<"inactivity">;

type NotificationsPromptOptInStateInput = {
  permissionStatus: NotificationPermissionStatus;
  areNotificationsAllowed: boolean | undefined;
  transactionsAlertsCategory: boolean | undefined;
};

type GetNextRepromptDelayInput = NotificationsPromptOptInStateInput & {
  repromptSchedule?: NotificationsPromptRepromptDelay[] | null;
  history: NotificationPromptHistory | null | undefined;
};

type AfterActionEligibilityInput = NotificationsPromptOptInStateInput & {
  history: NotificationPromptHistory | null | undefined;
  repromptSchedule?: NotificationsPromptRepromptDelay[] | null;
  now?: number;
};

type NotificationsPromptEvaluationContext = {
  policy: NotificationPromptPolicy | null | undefined;
  isRatingsModalOpen: boolean;
  isDrawerPending: boolean;
  now?: number;
};

type EvaluateAfterActionTriggerParams = NotificationsPromptOptInStateInput & {
  source: NotificationPromptAfterActionSource;
  history: NotificationPromptHistory | null | undefined;
};

type EvaluateInactivityTriggerParams = {
  permissionStatus: NotificationPermissionStatus;
  areNotificationsAllowed: boolean | undefined;
  history: NotificationPromptHistory | null | undefined;
  hasCompletedOnboarding: boolean;
};

type CheckIsInactiveInput = {
  inactivityEnabled: boolean | undefined;
  inactivityReprompt: NotificationsPromptRepromptDelay | null | undefined;
  lastActionAt?: number;
  now?: number;
};

const AFTER_ACTION_SOURCE_TO_EVENT_KEY = {
  onboarding: "complete_onboarding",
  send: "send",
  dapp_complete: "dapp_complete",
  receive: "receive",
  swap: "swap",
  stake: "stake",
  add_favorite_coin: "add_favorite_coin",
} as const satisfies Record<NotificationPromptAfterActionSource, NotificationPromptActionEventKey>;

export const INACTIVITY_DRAWER_DELAY_MS = 1000;

const TRANSACTIONS_ALERTS_PROMPT_TARGET =
  "transactionsAlertsCategory" as const satisfies NotificationPromptTarget;

const addDuration = (timestamp: number, duration: NotificationsPromptRepromptDelay): number => {
  const date = new Date(timestamp);
  date.setMonth(date.getMonth() + (duration.months ?? 0));
  date.setDate(date.getDate() + (duration.days ?? 0));
  date.setHours(date.getHours() + (duration.hours ?? 0));
  date.setMinutes(date.getMinutes() + (duration.minutes ?? 0));
  date.setSeconds(date.getSeconds() + (duration.seconds ?? 0));
  return date.getTime();
};

const isVariantA = (policy: NotificationPromptPolicy | null | undefined) => policy?.variant === "A";

const isGloballyOptedIn = (
  permissionStatus: NotificationPermissionStatus,
  areNotificationsAllowed: boolean | undefined,
) => permissionStatus === "authorized" && areNotificationsAllowed === true;

export const getNotificationPromptTarget = ({
  permissionStatus,
  areNotificationsAllowed,
  transactionsAlertsCategory,
}: NotificationsPromptOptInStateInput): NotificationPromptTarget | null => {
  if (!isGloballyOptedIn(permissionStatus, areNotificationsAllowed)) {
    return "globalPushNotifications";
  }

  if (transactionsAlertsCategory === true) {
    return null;
  }

  return TRANSACTIONS_ALERTS_PROMPT_TARGET;
};

export const canPromptTransactionsAlertsForAction = (
  source: NotificationPromptAfterActionSource,
  notificationsCategories: NotificationPromptCategoryConfig[] | undefined,
): boolean => {
  const transactionsAlertsCategoryConfig = notificationsCategories?.find(
    category => category.category === TRANSACTIONS_ALERTS_PROMPT_TARGET,
  );

  if (!transactionsAlertsCategoryConfig?.drawerPromptEnabled) {
    return false;
  }

  return transactionsAlertsCategoryConfig.drawerPromptActions?.includes(source) ?? false;
};

const getDismissedPromptAtList = (
  history: NotificationPromptHistory | null | undefined,
  promptTarget: NotificationPromptTarget,
): number[] | undefined => {
  const dismissedPromptAtListByTarget = history?.dismissedPromptAtListByTarget ?? {};

  if (promptTarget === "globalPushNotifications") {
    return (
      dismissedPromptAtListByTarget.globalPushNotifications ?? history?.dismissedOptInDrawerAtList
    );
  }

  return dismissedPromptAtListByTarget[promptTarget];
};

const hasRepromptDelayElapsed = ({
  history,
  promptTarget,
  repromptSchedule,
  now,
}: {
  history: NotificationPromptHistory | null | undefined;
  promptTarget: NotificationPromptTarget;
  repromptSchedule: NotificationsPromptRepromptDelay[] | null | undefined;
  now: number;
}): { canShow: boolean; nextRepromptDelay: NotificationsPromptRepromptDelay | null } => {
  const dismissedPromptAtList = getDismissedPromptAtList(history, promptTarget);

  if (!dismissedPromptAtList?.length) {
    return { canShow: true, nextRepromptDelay: null };
  }

  const nextRepromptDelay = (() => {
    if (!repromptSchedule?.length) {
      return null;
    }

    const scheduleIndex = Math.min(dismissedPromptAtList.length - 1, repromptSchedule.length - 1);
    return repromptSchedule[scheduleIndex];
  })();

  if (!nextRepromptDelay) {
    return { canShow: false, nextRepromptDelay: null };
  }

  const lastDismissedAt = dismissedPromptAtList[dismissedPromptAtList.length - 1];
  return {
    canShow: addDuration(lastDismissedAt, nextRepromptDelay) <= now,
    nextRepromptDelay,
  };
};

const getDismissedCount = (
  history: NotificationPromptHistory | null | undefined,
  promptTarget: NotificationPromptTarget | null,
) => {
  if (!promptTarget) {
    return 0;
  }

  return getDismissedPromptAtList(history, promptTarget)?.length ?? 0;
};

const getDecisionBase = <TSource extends NotificationPromptSource>(
  source: TSource,
  history: NotificationPromptHistory | null | undefined,
  promptTarget: NotificationPromptTarget | null,
  nextRepromptDelay: NotificationsPromptRepromptDelay | null,
  policy: NotificationPromptPolicy | null | undefined,
): NotificationsPromptDecisionBase<TSource> => ({
  source,
  dismissedCount: getDismissedCount(history, promptTarget),
  nextRepromptDelay,
  variant: policy?.variant,
});

type BuildAfterActionPromptDecisionInput = {
  source: NotificationPromptAfterActionSource;
  history: NotificationPromptHistory | null | undefined;
  promptTarget: NotificationPromptTarget;
  repromptSchedule: NotificationsPromptRepromptDelay[] | null | undefined;
  policy: NotificationPromptPolicy | null | undefined;
  now: number;
  delayMs: number;
};

const buildAfterActionPromptDecision = ({
  source,
  history,
  promptTarget,
  repromptSchedule,
  policy,
  now,
  delayMs,
}: BuildAfterActionPromptDecisionInput): AfterActionTriggerDecision => {
  const { canShow, nextRepromptDelay } = hasRepromptDelayElapsed({
    history,
    promptTarget,
    repromptSchedule,
    now,
  });
  const baseDecision = getDecisionBase(source, history, promptTarget, nextRepromptDelay, policy);

  if (!canShow) {
    return {
      ...baseDecision,
      kind: "skip",
      reason: nextRepromptDelay ? "reprompt_delay_not_reached" : "configuration_missing",
    };
  }

  return {
    ...baseDecision,
    kind: "show",
    delayMs,
    drawerPromptTarget: promptTarget,
  };
};

export const getNextRepromptDelay = ({
  repromptSchedule,
  history,
  permissionStatus,
  areNotificationsAllowed,
  transactionsAlertsCategory,
}: GetNextRepromptDelayInput): NotificationsPromptRepromptDelay | null => {
  const promptTarget = getNotificationPromptTarget({
    permissionStatus,
    areNotificationsAllowed,
    transactionsAlertsCategory,
  });
  if (!promptTarget) {
    return null;
  }

  const dismissedPromptAtList = getDismissedPromptAtList(history, promptTarget);
  if (!repromptSchedule?.length || !dismissedPromptAtList?.length) {
    return null;
  }

  const scheduleIndex = Math.min(dismissedPromptAtList.length - 1, repromptSchedule.length - 1);
  return repromptSchedule[scheduleIndex];
};

export const shouldPromptOptInDrawerAfterAction = ({
  permissionStatus,
  areNotificationsAllowed,
  history,
  repromptSchedule,
  now = Date.now(),
}: AfterActionEligibilityInput): boolean => {
  if (!isGloballyOptedIn(permissionStatus, areNotificationsAllowed)) {
    return hasRepromptDelayElapsed({
      history,
      promptTarget: "globalPushNotifications",
      repromptSchedule,
      now,
    }).canShow;
  }

  return false;
};

export const checkIsInactive = ({
  inactivityEnabled,
  inactivityReprompt,
  lastActionAt,
  now = Date.now(),
}: CheckIsInactiveInput): boolean => {
  if (!inactivityEnabled || !inactivityReprompt || lastActionAt === undefined) {
    return false;
  }

  return addDuration(lastActionAt, inactivityReprompt) <= now;
};

export const evaluateAfterActionTrigger = (
  {
    source,
    permissionStatus,
    areNotificationsAllowed,
    transactionsAlertsCategory,
    history,
  }: EvaluateAfterActionTriggerParams,
  {
    policy,
    isRatingsModalOpen,
    isDrawerPending,
    now = Date.now(),
  }: NotificationsPromptEvaluationContext,
): AfterActionTriggerDecision => {
  const repromptSchedule = policy?.repromptSchedule;
  const globallyOptedIn = isGloballyOptedIn(permissionStatus, areNotificationsAllowed);
  const drawerPromptTarget = getNotificationPromptTarget({
    permissionStatus,
    areNotificationsAllowed,
    transactionsAlertsCategory,
  });
  const baseDecision = getDecisionBase(source, history, drawerPromptTarget, null, policy);

  if (!policy?.enabled) {
    return { ...baseDecision, kind: "skip", reason: "feature_disabled" };
  }

  if (!policy.actionEvents) {
    return { ...baseDecision, kind: "skip", reason: "configuration_missing" };
  }

  if (isRatingsModalOpen) {
    return { ...baseDecision, kind: "skip", reason: "ratings_modal_open" };
  }

  if (isDrawerPending) {
    return { ...baseDecision, kind: "skip", reason: "drawer_already_pending" };
  }

  if (source !== "onboarding" && isVariantA(policy)) {
    return { ...baseDecision, kind: "skip", reason: "variant_a_only_onboarding" };
  }

  const actionEvent = policy.actionEvents[AFTER_ACTION_SOURCE_TO_EVENT_KEY[source]];
  if (!actionEvent) {
    return { ...baseDecision, kind: "skip", reason: "configuration_missing" };
  }

  if (!actionEvent.enabled) {
    return { ...baseDecision, kind: "skip", reason: "action_event_disabled" };
  }

  if (!globallyOptedIn) {
    return buildAfterActionPromptDecision({
      source,
      history,
      promptTarget: "globalPushNotifications",
      repromptSchedule,
      policy,
      now,
      delayMs: actionEvent.timer,
    });
  }

  if (transactionsAlertsCategory === true) {
    return { ...baseDecision, kind: "skip", reason: "fully_opted_in" };
  }

  const isTransactionsAlertsEligible = canPromptTransactionsAlertsForAction(
    source,
    policy.notificationsCategories,
  );
  if (!isTransactionsAlertsEligible) {
    return { ...baseDecision, kind: "skip", reason: "transactions_alerts_not_eligible" };
  }

  return buildAfterActionPromptDecision({
    source,
    history,
    promptTarget: TRANSACTIONS_ALERTS_PROMPT_TARGET,
    repromptSchedule,
    policy,
    now,
    delayMs: actionEvent.timer,
  });
};

export const evaluateInactivityTrigger = (
  {
    permissionStatus,
    areNotificationsAllowed,
    history,
    hasCompletedOnboarding,
  }: EvaluateInactivityTriggerParams,
  {
    policy,
    isRatingsModalOpen,
    isDrawerPending,
    now = Date.now(),
  }: NotificationsPromptEvaluationContext,
): InactivityTriggerDecision => {
  const globallyOptedIn = isGloballyOptedIn(permissionStatus, areNotificationsAllowed);
  const globalPromptTarget = "globalPushNotifications";
  const baseDecision = getDecisionBase(
    "inactivity",
    history,
    globallyOptedIn ? null : globalPromptTarget,
    null,
    policy,
  );

  if (!policy?.enabled) {
    return { ...baseDecision, kind: "skip", reason: "feature_disabled" };
  }

  if (isRatingsModalOpen) {
    return { ...baseDecision, kind: "skip", reason: "ratings_modal_open" };
  }

  if (isDrawerPending) {
    return { ...baseDecision, kind: "skip", reason: "drawer_already_pending" };
  }

  if (!hasCompletedOnboarding) {
    return { ...baseDecision, kind: "skip", reason: "onboarding_incomplete" };
  }

  if (isVariantA(policy)) {
    return { ...baseDecision, kind: "skip", reason: "variant_a_inactivity_disabled" };
  }

  if (!policy.inactivityReprompt) {
    return { ...baseDecision, kind: "skip", reason: "configuration_missing" };
  }

  if (!policy.inactivityEnabled) {
    return { ...baseDecision, kind: "skip", reason: "feature_disabled" };
  }

  if (globallyOptedIn) {
    return {
      ...baseDecision,
      kind: "skip",
      reason: "globally_opted_in_no_inactivity_drawer",
    };
  }

  const isInactive = checkIsInactive({
    inactivityEnabled: policy.inactivityEnabled,
    inactivityReprompt: policy.inactivityReprompt,
    lastActionAt: history?.lastActionAt,
    now,
  });

  if (!isInactive) {
    return { ...baseDecision, kind: "skip", reason: "user_not_inactive" };
  }

  return {
    ...getDecisionBase("inactivity", history, globalPromptTarget, null, policy),
    kind: "show",
    delayMs: INACTIVITY_DRAWER_DELAY_MS,
    drawerPromptTarget: globalPromptTarget,
  };
};
