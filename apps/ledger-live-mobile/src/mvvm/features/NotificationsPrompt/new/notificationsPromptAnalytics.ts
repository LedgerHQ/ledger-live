import { track } from "~/analytics";
import {
  type AfterActionTriggerDecision,
  type InactivityTriggerDecision,
} from "LLM/features/NotificationsPrompt";
import type { NotificationPromptTarget } from "../types";

const GLOBAL_PUSH_NOTIFICATIONS_PROMPT_TARGET = "globalPushNotifications" as const;

/** For drawer-visible events only; attempt events on skip keep drawerPromptTarget undefined. */
export const resolveDrawerPromptTargetForAnalytics = (
  drawerPromptTarget: NotificationPromptTarget | undefined,
): NotificationPromptTarget => drawerPromptTarget ?? GLOBAL_PUSH_NOTIFICATIONS_PROMPT_TARGET;

const getDrawerPromptTargetFromAfterActionDecision = (
  decision: AfterActionTriggerDecision,
): NotificationPromptTarget | undefined =>
  decision.kind === "show" ? decision.drawerPromptTarget : undefined;

const getDrawerPromptTargetFromInactivityDecision = (
  decision: InactivityTriggerDecision,
): NotificationPromptTarget | undefined =>
  decision.kind === "show" ? decision.drawerPromptTarget : undefined;

export function trackAfterActionDecision(decision: AfterActionTriggerDecision) {
  track("attempt_to_trigger_push_notification_drawer_after_action", {
    action: decision.source,
    shouldPrompt: decision.kind === "show",
    variant: decision.variant,
    repromptDelay: decision.nextRepromptDelay,
    dismissedCount: decision.dismissedCount,
    skipReason: decision.kind === "skip" ? decision.reason : undefined,
    drawerPromptTarget: getDrawerPromptTargetFromAfterActionDecision(decision),
  });
}

export function trackInactivityDecision(decision: InactivityTriggerDecision) {
  track("attempt_to_trigger_push_notification_drawer_after_inactivity", {
    shouldPrompt: decision.kind === "show",
    variant: decision.variant,
    repromptDelay: decision.nextRepromptDelay,
    dismissedCount: decision.dismissedCount,
    skipReason: decision.kind === "skip" ? decision.reason : undefined,
    drawerPromptTarget: getDrawerPromptTargetFromInactivityDecision(decision),
  });
}
