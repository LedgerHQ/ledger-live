import { add } from "date-fns";
import { AuthorizationStatus } from "@react-native-firebase/messaging";
import type { Features } from "@shared/feature-flags";
import { AB_TESTING_VARIANTS, type ABTestingVariants } from "../types/variants";
import type { NotificationsState } from "~/reducers/types";
import type { DataOfUser, NotificationPromptTarget } from "../types";

type BrazePushNotifications = Features["brazePushNotifications"];
type LwmNewWordingOptInNotificationsDrawer = Features["lwmNewWordingOptInNotificationsDrawer"];

type PermissionStatus =
  | (typeof AuthorizationStatus)[keyof typeof AuthorizationStatus]
  | null
  | undefined;

type BrazePushNotificationsFeature = BrazePushNotifications | null | undefined;
type WordingFeature = LwmNewWordingOptInNotificationsDrawer | null | undefined;

export type NotificationsPromptSource = NonNullable<NotificationsState["drawerSource"]>;
export type NotificationsPromptAfterActionSource = Exclude<NotificationsPromptSource, "inactivity">;
export type NotificationsPromptRepromptDelay = NonNullable<
  BrazePushNotifications["params"]
>["reprompt_schedule"][number];

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

type NotificationsPromptDecisionBase<TSource extends NotificationsPromptSource> = {
  source: TSource;
  dismissedCount: number;
  nextRepromptDelay: NotificationsPromptRepromptDelay | null;
  variant?: ABTestingVariants;
};

export type NotificationsPromptShowDecision<TSource extends NotificationsPromptSource> =
  NotificationsPromptDecisionBase<TSource> & {
    kind: "show";
    delayMs: number;
    drawerPromptTarget: NotificationPromptTarget;
  };

export type NotificationsPromptSkipDecision<TSource extends NotificationsPromptSource> =
  NotificationsPromptDecisionBase<TSource> & {
    kind: "skip";
    reason: NotificationsPromptSkipReason;
  };

export type AfterActionTriggerDecision =
  | NotificationsPromptShowDecision<NotificationsPromptAfterActionSource>
  | NotificationsPromptSkipDecision<NotificationsPromptAfterActionSource>;

export type InactivityTriggerDecision =
  | NotificationsPromptShowDecision<"inactivity">
  | NotificationsPromptSkipDecision<"inactivity">;

type NotificationsPromptOptInStateInput = {
  permissionStatus: PermissionStatus;
  areNotificationsAllowed: boolean | undefined;
  transactionsAlertsCategory: boolean | undefined;
};

type GetNextRepromptDelayInput = NotificationsPromptOptInStateInput & {
  repromptSchedule?: NotificationsPromptRepromptDelay[] | null;
  pushNotificationsDataOfUser: DataOfUser | null | undefined;
};

type AfterActionEligibilityInput = NotificationsPromptOptInStateInput & {
  pushNotificationsDataOfUser: DataOfUser | null | undefined;
  repromptSchedule?: NotificationsPromptRepromptDelay[] | null;
  now?: number;
};

type NotificationsPromptEvaluationContext = {
  brazePushNotifications: BrazePushNotificationsFeature;
  wordingFeature: WordingFeature;
  isRatingsModalOpen: boolean;
  isDrawerPending: boolean;
  now?: number;
};

type EvaluateAfterActionTriggerParams = NotificationsPromptOptInStateInput & {
  source: NotificationsPromptAfterActionSource;
  pushNotificationsDataOfUser: DataOfUser | null | undefined;
};

type EvaluateInactivityTriggerParams = {
  permissionStatus: PermissionStatus;
  areNotificationsAllowed: boolean | undefined;
  pushNotificationsDataOfUser: DataOfUser | null | undefined;
  hasCompletedOnboarding: boolean;
};

type CheckIsInactiveInput = {
  inactivityEnabled: boolean | undefined;
  inactivityReprompt:
    | NonNullable<BrazePushNotifications["params"]>["inactivity_reprompt"]
    | null
    | undefined;
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
} as const satisfies Record<
  NotificationsPromptAfterActionSource,
  keyof NonNullable<BrazePushNotifications["params"]>["action_events"]
>;

export const INACTIVITY_DRAWER_DELAY_MS = 1000;

const TRANSACTIONS_ALERTS_PROMPT_TARGET =
  "transactionsAlertsCategory" as const satisfies NotificationPromptTarget;

type BrazeNotificationsCategoryConfig = NonNullable<
  BrazePushNotifications["params"]
>["notificationsCategories"][number];

const getVariant = (wordingFeature: WordingFeature) =>
  wordingFeature?.enabled ? wordingFeature.params?.variant : undefined;

const isVariantA = (wordingFeature: WordingFeature) =>
  getVariant(wordingFeature) === AB_TESTING_VARIANTS.A;

const isGloballyOptedIn = (
  permissionStatus: PermissionStatus,
  areNotificationsAllowed: boolean | undefined,
) => permissionStatus === AuthorizationStatus.AUTHORIZED && areNotificationsAllowed === true;

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
  source: NotificationsPromptAfterActionSource,
  notificationsCategories: BrazeNotificationsCategoryConfig[] | undefined,
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
  pushNotificationsDataOfUser: DataOfUser | null | undefined,
  promptTarget: NotificationPromptTarget,
): number[] | undefined => {
  const dismissedPromptAtListByTarget =
    pushNotificationsDataOfUser?.dismissedPromptAtListByTarget ?? {};

  if (promptTarget === "globalPushNotifications") {
    return (
      dismissedPromptAtListByTarget.globalPushNotifications ??
      pushNotificationsDataOfUser?.dismissedOptInDrawerAtList
    );
  }

  return dismissedPromptAtListByTarget[promptTarget];
};

const hasRepromptDelayElapsed = ({
  pushNotificationsDataOfUser,
  promptTarget,
  repromptSchedule,
  now,
}: {
  pushNotificationsDataOfUser: DataOfUser | null | undefined;
  promptTarget: NotificationPromptTarget;
  repromptSchedule: NotificationsPromptRepromptDelay[] | null | undefined;
  now: number;
}): { canShow: boolean; nextRepromptDelay: NotificationsPromptRepromptDelay | null } => {
  const dismissedPromptAtList = getDismissedPromptAtList(pushNotificationsDataOfUser, promptTarget);

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
    canShow: add(lastDismissedAt, nextRepromptDelay).getTime() <= now,
    nextRepromptDelay,
  };
};

const getDismissedCount = (
  pushNotificationsDataOfUser: DataOfUser | null | undefined,
  promptTarget: NotificationPromptTarget | null,
) => {
  if (!promptTarget) {
    return 0;
  }

  return getDismissedPromptAtList(pushNotificationsDataOfUser, promptTarget)?.length ?? 0;
};

const getDecisionBase = <TSource extends NotificationsPromptSource>(
  source: TSource,
  pushNotificationsDataOfUser: DataOfUser | null | undefined,
  promptTarget: NotificationPromptTarget | null,
  nextRepromptDelay: NotificationsPromptRepromptDelay | null,
  wordingFeature: WordingFeature,
): NotificationsPromptDecisionBase<TSource> => ({
  source,
  dismissedCount: getDismissedCount(pushNotificationsDataOfUser, promptTarget),
  nextRepromptDelay,
  variant: getVariant(wordingFeature),
});

type BuildAfterActionPromptDecisionInput = {
  source: NotificationsPromptAfterActionSource;
  pushNotificationsDataOfUser: DataOfUser | null | undefined;
  promptTarget: NotificationPromptTarget;
  repromptSchedule: NotificationsPromptRepromptDelay[] | null | undefined;
  wordingFeature: WordingFeature;
  now: number;
  delayMs: number;
};

const buildAfterActionPromptDecision = ({
  source,
  pushNotificationsDataOfUser,
  promptTarget,
  repromptSchedule,
  wordingFeature,
  now,
  delayMs,
}: BuildAfterActionPromptDecisionInput): AfterActionTriggerDecision => {
  const { canShow, nextRepromptDelay } = hasRepromptDelayElapsed({
    pushNotificationsDataOfUser,
    promptTarget,
    repromptSchedule,
    now,
  });
  const baseDecision = getDecisionBase(
    source,
    pushNotificationsDataOfUser,
    promptTarget,
    nextRepromptDelay,
    wordingFeature,
  );

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
  pushNotificationsDataOfUser,
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

  const dismissedPromptAtList = getDismissedPromptAtList(pushNotificationsDataOfUser, promptTarget);
  if (!repromptSchedule?.length || !dismissedPromptAtList?.length) {
    return null;
  }

  const scheduleIndex = Math.min(dismissedPromptAtList.length - 1, repromptSchedule.length - 1);
  return repromptSchedule[scheduleIndex];
};

export const shouldPromptOptInDrawerAfterAction = ({
  permissionStatus,
  areNotificationsAllowed,
  pushNotificationsDataOfUser,
  repromptSchedule,
  now = Date.now(),
}: AfterActionEligibilityInput): boolean => {
  if (!isGloballyOptedIn(permissionStatus, areNotificationsAllowed)) {
    return hasRepromptDelayElapsed({
      pushNotificationsDataOfUser,
      promptTarget: "globalPushNotifications",
      repromptSchedule,
      now,
    }).canShow;
  }

  // Global opt-in drawer only (legacy hook). Category prompts use evaluateAfterActionTrigger.
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

  return add(lastActionAt, inactivityReprompt).getTime() <= now;
};

export const evaluateAfterActionTrigger = (
  {
    source,
    permissionStatus,
    areNotificationsAllowed,
    transactionsAlertsCategory,
    pushNotificationsDataOfUser,
  }: EvaluateAfterActionTriggerParams,
  {
    brazePushNotifications,
    wordingFeature,
    isRatingsModalOpen,
    isDrawerPending,
    now = Date.now(),
  }: NotificationsPromptEvaluationContext,
): AfterActionTriggerDecision => {
  const repromptSchedule = brazePushNotifications?.params?.reprompt_schedule;
  const globallyOptedIn = isGloballyOptedIn(permissionStatus, areNotificationsAllowed);
  const drawerPromptTarget = getNotificationPromptTarget({
    permissionStatus,
    areNotificationsAllowed,
    transactionsAlertsCategory,
  });
  const baseDecision = getDecisionBase(
    source,
    pushNotificationsDataOfUser,
    drawerPromptTarget,
    null,
    wordingFeature,
  );

  if (!brazePushNotifications?.enabled) {
    return { ...baseDecision, kind: "skip", reason: "feature_disabled" };
  }

  if (!brazePushNotifications.params?.action_events) {
    return { ...baseDecision, kind: "skip", reason: "configuration_missing" };
  }

  if (isRatingsModalOpen) {
    return { ...baseDecision, kind: "skip", reason: "ratings_modal_open" };
  }

  if (isDrawerPending) {
    return { ...baseDecision, kind: "skip", reason: "drawer_already_pending" };
  }

  if (source !== "onboarding" && isVariantA(wordingFeature)) {
    return { ...baseDecision, kind: "skip", reason: "variant_a_only_onboarding" };
  }

  const actionEvent =
    brazePushNotifications.params.action_events[AFTER_ACTION_SOURCE_TO_EVENT_KEY[source]];
  if (!actionEvent) {
    return { ...baseDecision, kind: "skip", reason: "configuration_missing" };
  }

  if (!actionEvent.enabled) {
    return { ...baseDecision, kind: "skip", reason: "action_event_disabled" };
  }

  if (!globallyOptedIn) {
    return buildAfterActionPromptDecision({
      source,
      pushNotificationsDataOfUser,
      promptTarget: "globalPushNotifications",
      repromptSchedule,
      wordingFeature,
      now,
      delayMs: actionEvent.timer,
    });
  }

  if (transactionsAlertsCategory === true) {
    return { ...baseDecision, kind: "skip", reason: "fully_opted_in" };
  }

  const isTransactionsAlertsEligible = canPromptTransactionsAlertsForAction(
    source,
    brazePushNotifications.params.notificationsCategories,
  );
  if (!isTransactionsAlertsEligible) {
    return { ...baseDecision, kind: "skip", reason: "transactions_alerts_not_eligible" };
  }

  return buildAfterActionPromptDecision({
    source,
    pushNotificationsDataOfUser,
    promptTarget: TRANSACTIONS_ALERTS_PROMPT_TARGET,
    repromptSchedule,
    wordingFeature,
    now,
    delayMs: actionEvent.timer,
  });
};

/** Global push opt-in only. Transaction alerts are handled in {@link evaluateAfterActionTrigger}. */
export const evaluateInactivityTrigger = (
  {
    permissionStatus,
    areNotificationsAllowed,
    pushNotificationsDataOfUser,
    hasCompletedOnboarding,
  }: EvaluateInactivityTriggerParams,
  {
    brazePushNotifications,
    wordingFeature,
    isRatingsModalOpen,
    isDrawerPending,
    now = Date.now(),
  }: NotificationsPromptEvaluationContext,
): InactivityTriggerDecision => {
  const globallyOptedIn = isGloballyOptedIn(permissionStatus, areNotificationsAllowed);
  const globalPromptTarget = "globalPushNotifications";
  const baseDecision = getDecisionBase(
    "inactivity",
    pushNotificationsDataOfUser,
    globallyOptedIn ? null : globalPromptTarget,
    null,
    wordingFeature,
  );

  if (!brazePushNotifications?.enabled) {
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

  if (isVariantA(wordingFeature)) {
    return { ...baseDecision, kind: "skip", reason: "variant_a_inactivity_disabled" };
  }

  if (!brazePushNotifications.params?.inactivity_reprompt) {
    return { ...baseDecision, kind: "skip", reason: "configuration_missing" };
  }

  if (!brazePushNotifications.params.inactivity_enabled) {
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
    inactivityEnabled: brazePushNotifications.params.inactivity_enabled,
    inactivityReprompt: brazePushNotifications.params.inactivity_reprompt,
    lastActionAt: pushNotificationsDataOfUser?.lastActionAt,
    now,
  });

  if (!isInactive) {
    return { ...baseDecision, kind: "skip", reason: "user_not_inactive" };
  }

  return {
    ...getDecisionBase(
      "inactivity",
      pushNotificationsDataOfUser,
      globalPromptTarget,
      null,
      wordingFeature,
    ),
    kind: "show",
    delayMs: INACTIVITY_DRAWER_DELAY_MS,
    drawerPromptTarget: globalPromptTarget,
  };
};
