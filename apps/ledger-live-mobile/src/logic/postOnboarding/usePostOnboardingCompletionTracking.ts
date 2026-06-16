import { useEffect, useRef } from "react";
import { usePostOnboardingHubState } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { track } from "~/analytics";
import { usePostOnboardingHubStepperDisplay } from "./usePostOnboardingHubStepperDisplay";

export function usePostOnboardingCompletionTracking(): void {
  const { actionsState, deviceModelId } = usePostOnboardingHubState();
  const { areAllActionsCompleted, loading } = usePostOnboardingHubStepperDisplay(actionsState);

  const initializedRef = useRef(false);
  const hasTrackedRef = useRef(false);

  useEffect(() => {
    if (loading) return;

    if (actionsState.length === 0) return;

    if (!initializedRef.current) {
      initializedRef.current = true;
      hasTrackedRef.current = areAllActionsCompleted;
      return;
    }

    if (!areAllActionsCompleted) {
      // Genuinely not complete: re-arm so a subsequent completion is tracked.
      hasTrackedRef.current = false;
      return;
    }

    if (hasTrackedRef.current || !deviceModelId) return;
    hasTrackedRef.current = true;
    track("Post-onboarding widget completed", {
      deviceModelId,
      flow: "post-onboarding",
    });
  }, [loading, areAllActionsCompleted, deviceModelId, actionsState.length]);
}
