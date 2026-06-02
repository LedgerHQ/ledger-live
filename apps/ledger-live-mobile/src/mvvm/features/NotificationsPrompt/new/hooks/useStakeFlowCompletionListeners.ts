import { useMemo } from "react";
import { useNotificationsContext } from "LLM/features/NotificationsPrompt/new/NotificationsPromptProvider";

/**
 * Navigation listeners for a stake-flow ValidationSuccess screen.
 *
 * Attach the returned object to the success `<Stack.Screen listeners={...}>` so
 * that leaving the success screen triggers the push-notification opt-in prompt.
 * This centralizes wiring that was otherwise duplicated, identically, in every
 * family stake flow (`beforeRemove: () => notifyFlowCompleted("stake")`).
 */
export function useStakeFlowCompletionListeners() {
  const { notifyFlowCompleted } = useNotificationsContext();
  return useMemo(
    () => ({
      beforeRemove: () => {
        notifyFlowCompleted("stake");
      },
    }),
    [notifyFlowCompleted],
  );
}
