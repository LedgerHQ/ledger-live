import { add } from "date-fns";
import { AuthorizationStatus } from "@react-native-firebase/messaging";
import { ABTestingVariants } from "@ledgerhq/types-live";
import type {
  Feature_BrazePushNotifications,
  Feature_LwmNewWordingOptInNotificationsDrawer,
} from "@ledgerhq/types-live";
import type { NotificationsState } from "~/reducers/types";
import type { DataOfUser } from "../types";

type PermissionStatus =
  | (typeof AuthorizationStatus)[keyof typeof AuthorizationStatus]
  | null
  | undefined;

type BrazePushNotificationsFeature = Feature_BrazePushNotifications | null | undefined;
type WordingFeature = Feature_LwmNewWordingOptInNotificationsDrawer | null | undefined;

export type NotificationsPromptSource = NonNullable<NotificationsState["drawerSource"]>;
export type NotificationsPromptAfterActionSource = Exclude<NotificationsPromptSource, "inactivity">;
export type NotificationsPromptRepromptDelay = NonNullable<
  Feature_BrazePushNotifications["params"]
>["reprompt_schedule"][number];

export type NotificationsPromptSkipReason =
  | "feature_disabled"
  | "configuration_missing"
  | "ratings_modal_open"
  | "drawer_already_pending"
  | "fully_opted_in"
  | "reprompt_delay_not_reached"
  | "action_event_disabled"
  | "variant_a_only_onboarding"
  | "variant_a_inactivity_disabled"
  | "onboarding_incomplete"
  | "user_not_inactive";

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

type GetNextRepromptDelayInput = {
  repromptSchedule?: NotificationsPromptRepromptDelay[] | null;
  pushNotificationsDataOfUser: DataOfUser | null | undefined;
};

type AfterActionEligibilityInput = {
  permissionStatus: PermissionStatus;
  areNotificationsAllowed: boolean | undefined;
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

type EvaluateAfterActionTriggerParams = {
  source: NotificationsPromptAfterActionSource;
  permissionStatus: PermissionStatus;
  areNotificationsAllowed: boolean | undefined;
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
    | NonNullable<Feature_BrazePushNotifications["params"]>["inactivity_reprompt"]
    | null
    | undefined;
  lastActionAt?: number;
  now?: number;
};

const AFTER_ACTION_SOURCE_TO_EVENT_KEY = {
  onboarding: "complete_onboarding",
  send: "send",
  receive: "receive",
  swap: "swap",
  stake: "stake",
  add_favorite_coin: "add_favorite_coin",
} as const satisfies Record<
  NotificationsPromptAfterActionSource,
  keyof NonNullable<Feature_BrazePushNotifications["params"]>["action_events"]
>;

export const INACTIVITY_DRAWER_DELAY_MS = 1000;

const getVariant = (wordingFeature: WordingFeature) =>
  wordingFeature?.enabled ? wordingFeature.params?.variant : undefined;

const isVariantA = (wordingFeature: WordingFeature) =>
  getVariant(wordingFeature) === ABTestingVariants.variantA;

const getDismissedCount = (pushNotificationsDataOfUser: DataOfUser | null | undefined) =>
  pushNotificationsDataOfUser?.dismissedOptInDrawerAtList?.length ?? 0;

const isFullyOptedIn = (
  permissionStatus: PermissionStatus,
  areNotificationsAllowed: boolean | undefined,
) => permissionStatus === AuthorizationStatus.AUTHORIZED && areNotificationsAllowed === true;

const getDecisionBase = <TSource extends NotificationsPromptSource>(
  source: TSource,
  pushNotificationsDataOfUser: DataOfUser | null | undefined,
  nextRepromptDelay: NotificationsPromptRepromptDelay | null,
  wordingFeature: WordingFeature,
): NotificationsPromptDecisionBase<TSource> => ({
  source,
  dismissedCount: getDismissedCount(pushNotificationsDataOfUser),
  nextRepromptDelay,
  variant: getVariant(wordingFeature),
});

export const getNextRepromptDelay = ({
  repromptSchedule,
  pushNotificationsDataOfUser,
}: GetNextRepromptDelayInput): NotificationsPromptRepromptDelay | null => {
  const dismissedOptInDrawerAtList = pushNotificationsDataOfUser?.dismissedOptInDrawerAtList;
  if (!repromptSchedule?.length || !dismissedOptInDrawerAtList?.length) {
    return null;
  }

  const scheduleIndex = Math.min(
    dismissedOptInDrawerAtList.length - 1,
    repromptSchedule.length - 1,
  );
  return repromptSchedule[scheduleIndex];
};

export const shouldPromptOptInDrawerAfterAction = ({
  permissionStatus,
  areNotificationsAllowed,
  pushNotificationsDataOfUser,
  repromptSchedule,
  now = Date.now(),
}: AfterActionEligibilityInput): boolean => {
  if (isFullyOptedIn(permissionStatus, areNotificationsAllowed)) {
    return false;
  }

  const dismissedOptInDrawerAtList = pushNotificationsDataOfUser?.dismissedOptInDrawerAtList;
  if (!dismissedOptInDrawerAtList?.length) {
    return true;
  }

  const nextRepromptDelay = getNextRepromptDelay({
    repromptSchedule,
    pushNotificationsDataOfUser,
  });
  if (!nextRepromptDelay) {
    return false;
  }

  const lastDismissedAt = dismissedOptInDrawerAtList[dismissedOptInDrawerAtList.length - 1];
  return add(lastDismissedAt, nextRepromptDelay).getTime() <= now;
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
  const nextRepromptDelay = getNextRepromptDelay({
    repromptSchedule: brazePushNotifications?.params?.reprompt_schedule,
    pushNotificationsDataOfUser,
  });
  const baseDecision = getDecisionBase(
    source,
    pushNotificationsDataOfUser,
    nextRepromptDelay,
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

  if (isFullyOptedIn(permissionStatus, areNotificationsAllowed)) {
    return { ...baseDecision, kind: "skip", reason: "fully_opted_in" };
  }

  const dismissedOptInDrawerAtList = pushNotificationsDataOfUser?.dismissedOptInDrawerAtList;
  if (dismissedOptInDrawerAtList?.length) {
    if (!nextRepromptDelay) {
      return { ...baseDecision, kind: "skip", reason: "configuration_missing" };
    }

    const lastDismissedAt = dismissedOptInDrawerAtList[dismissedOptInDrawerAtList.length - 1];
    if (add(lastDismissedAt, nextRepromptDelay).getTime() > now) {
      return { ...baseDecision, kind: "skip", reason: "reprompt_delay_not_reached" };
    }
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

  return {
    ...baseDecision,
    kind: "show",
    delayMs: actionEvent.timer,
  };
};

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
  const baseDecision = getDecisionBase(
    "inactivity",
    pushNotificationsDataOfUser,
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

  if (isFullyOptedIn(permissionStatus, areNotificationsAllowed)) {
    return { ...baseDecision, kind: "skip", reason: "fully_opted_in" };
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
    ...baseDecision,
    kind: "show",
    delayMs: INACTIVITY_DRAWER_DELAY_MS,
  };
};
