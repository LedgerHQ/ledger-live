import { track } from "~/analytics";
import {
  type AfterActionTriggerDecision,
  type InactivityTriggerDecision,
} from "LLM/features/NotificationsPrompt";

export function trackAfterActionDecision(
  decision: AfterActionTriggerDecision,
  shouldPromptOptInDrawerAfterAction: () => boolean,
) {
  track("attempt_to_trigger_push_notification_drawer_after_action", {
    action: decision.source,
    shouldPrompt: shouldPromptOptInDrawerAfterAction(),
    variant: decision.variant,
    repromptDelay: decision.nextRepromptDelay,
    dismissedCount: decision.dismissedCount,
    skipReason: decision.kind === "skip" ? decision.reason : undefined,
  });
}

export function trackInactivityDecision(decision: InactivityTriggerDecision) {
  track("attempt_to_trigger_push_notification_drawer_after_inactivity", {
    shouldPrompt: decision.kind === "show",
    variant: decision.variant,
    repromptDelay: decision.nextRepromptDelay,
    dismissedCount: decision.dismissedCount,
    skipReason: decision.kind === "skip" ? decision.reason : undefined,
  });
}
