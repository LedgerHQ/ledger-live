import { useCallback, useMemo } from "react";
import { track } from "~/renderer/analytics/segment";
import useFinishOnboardingDialog from "LLD/features/FinishOnboarding/FinishOnboardingDialog/hooks/useFinishOnboardingDialog";
import { useFinishOnboardingState } from "LLD/features/FinishOnboarding/hooks/useFinishOnboardingState";

const TRACK_BUTTON_CLICKED_PROPERTY = {
  button: "Post onboarding widget",
  flow: "post-onboarding",
} as const;

export type FinishOnboardingWidgetViewProps = {
  readonly postOnboardingInProgress: boolean;
  readonly completedStepsAmount: number;
  readonly totalStepsAmount: number;
  readonly handleOpenFinishOnboardingDialog: () => void;
};

export function useFinishOnboardingWidgetViewModel(): FinishOnboardingWidgetViewProps {
  const { handleOpen: openFinishOnboardingDialog } = useFinishOnboardingDialog();
  const { deviceModelId, postOnboardingInProgress, completedStepsAmount, totalStepsAmount } =
    useFinishOnboardingState();

  const handleOpenFinishOnboardingDialog = useCallback(() => {
    track("button_clicked", {
      deviceModelId,
      ...TRACK_BUTTON_CLICKED_PROPERTY,
    });
    openFinishOnboardingDialog();
  }, [openFinishOnboardingDialog, deviceModelId]);

  return useMemo(
    () => ({
      postOnboardingInProgress,
      completedStepsAmount,
      totalStepsAmount,
      handleOpenFinishOnboardingDialog,
    }),
    [
      postOnboardingInProgress,
      completedStepsAmount,
      totalStepsAmount,
      handleOpenFinishOnboardingDialog,
    ],
  );
}
