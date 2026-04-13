import { useCallback, useMemo } from "react";
import { track } from "~/renderer/analytics/segment";
import { usePostOnboardingHubState } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { hidePostOnboardingWalletEntryPoint } from "@ledgerhq/live-common/postOnboarding/actions";
import { useNavigateToPostOnboardingHubCallback } from "~/renderer/components/PostOnboardingHub/logic/useNavigateToPostOnboardingHubCallback";
import { useDispatch } from "LLD/hooks/redux";

const TRACK_BUTTON_CLICKED_PROPERTY = {
  button: "Post onboarding widget",
  flow: "post-onboarding",
} as const;

export type WidgetCardViewModel = {
  readonly postOnboardingInProgress: boolean;
  readonly currentStep: number;
  readonly totalSteps: number;
  readonly handleNavigateToPostOnboardingHub: () => void;
  readonly handleHidePostOnboardingHubBanner: () => void;
};

export function useWidgetCardViewModel(): WidgetCardViewModel {
  const dispatch = useDispatch();
  const navigateToPostOnboardingHub = useNavigateToPostOnboardingHubCallback();
  const { deviceModelId, lastActionCompleted, actionsState, postOnboardingInProgress } =
    usePostOnboardingHubState();

  const currentStep = actionsState.findIndex(action => action.id === lastActionCompleted?.id) + 2;
  const totalSteps = actionsState.length + 1;

  const handleNavigateToPostOnboardingHub = useCallback(() => {
    track("button_clicked", {
      deviceModelId,
      ...TRACK_BUTTON_CLICKED_PROPERTY,
    });
    navigateToPostOnboardingHub();
  }, [navigateToPostOnboardingHub, deviceModelId]);

  const handleHidePostOnboardingHubBanner = useCallback(() => {
    dispatch(hidePostOnboardingWalletEntryPoint());
  }, [dispatch]);

  return useMemo(
    () => ({
      postOnboardingInProgress,
      currentStep,
      totalSteps,
      handleNavigateToPostOnboardingHub,
      handleHidePostOnboardingHubBanner,
    }),
    [
      postOnboardingInProgress,
      currentStep,
      totalSteps,
      handleNavigateToPostOnboardingHub,
      handleHidePostOnboardingHubBanner,
    ],
  );
}
