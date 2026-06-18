import type {
  AfterActionTriggerDecision,
  InactivityTriggerDecision,
  NotificationPromptTarget,
} from "@domain/entity-notification-prompt";

const GLOBAL_PUSH_NOTIFICATIONS_PROMPT_TARGET = "globalPushNotifications" as const;

export const resolveDrawerPromptTargetForAnalytics = <
  TPromptTarget extends string = NotificationPromptTarget,
>(
  drawerPromptTarget: TPromptTarget | undefined,
): TPromptTarget | typeof GLOBAL_PUSH_NOTIFICATIONS_PROMPT_TARGET =>
  drawerPromptTarget ?? GLOBAL_PUSH_NOTIFICATIONS_PROMPT_TARGET;

const getDrawerPromptTargetFromAfterActionDecision = (
  decision: AfterActionTriggerDecision,
): NotificationPromptTarget | undefined =>
  decision.kind === "show" ? decision.drawerPromptTarget : undefined;

const getDrawerPromptTargetFromInactivityDecision = (
  decision: InactivityTriggerDecision,
): NotificationPromptTarget | undefined =>
  decision.kind === "show" ? decision.drawerPromptTarget : undefined;

export const buildAfterActionDecisionAnalytics = (decision: AfterActionTriggerDecision) => ({
  event: "attempt_to_trigger_push_notification_drawer_after_action" as const,
  properties: {
    action: decision.source,
    shouldPrompt: decision.kind === "show",
    variant: decision.variant,
    repromptDelay: decision.nextRepromptDelay,
    dismissedCount: decision.dismissedCount,
    skipReason: decision.kind === "skip" ? decision.reason : undefined,
    drawerPromptTarget: getDrawerPromptTargetFromAfterActionDecision(decision),
  },
});

export const buildInactivityDecisionAnalytics = (decision: InactivityTriggerDecision) => ({
  event: "attempt_to_trigger_push_notification_drawer_after_inactivity" as const,
  properties: {
    shouldPrompt: decision.kind === "show",
    variant: decision.variant,
    repromptDelay: decision.nextRepromptDelay,
    dismissedCount: decision.dismissedCount,
    skipReason: decision.kind === "skip" ? decision.reason : undefined,
    drawerPromptTarget: getDrawerPromptTargetFromInactivityDecision(decision),
  },
});
