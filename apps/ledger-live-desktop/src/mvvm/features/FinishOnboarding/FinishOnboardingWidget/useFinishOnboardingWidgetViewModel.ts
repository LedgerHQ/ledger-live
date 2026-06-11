import { useCallback, useMemo } from "react";
import { track } from "~/renderer/analytics/segment";
import { usePostOnboardingHubState } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import useFinishOnboardingDialog from "LLD/features/FinishOnboarding/FinishOnboardingDialog/hooks/useFinishOnboardingDialog";
import { usePostOnboardingFinishProgress } from "LLD/features/FinishOnboarding/FinishOnboardingDialog/hooks/usePostOnboardingFinishProgress";

const TRACK_BUTTON_CLICKED_PROPERTY = {
  button: "Post onboarding widget",
  flow: "post-onboarding",
} as const;

export type FinishOnboardingWidgetViewProps = {
  readonly postOnboardingInProgress: boolean;
  readonly completedActionsAmount: number;
  readonly totalActionsAmount: number;
  readonly handleOpenFinishOnboardingDialog: () => void;
};

export function useFinishOnboardingWidgetViewModel(): FinishOnboardingWidgetViewProps {
  const { handleOpen: openFinishOnboardingDialog } = useFinishOnboardingDialog();
  const { deviceModelId, actionsState, postOnboardingInProgress } = usePostOnboardingHubState();
  const { completedActionsAmount, totalActionsAmount } =
    usePostOnboardingFinishProgress(actionsState);

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
      completedActionsAmount,
      totalActionsAmount,
      handleOpenFinishOnboardingDialog,
    }),
    [
      postOnboardingInProgress,
      completedActionsAmount,
      totalActionsAmount,
      handleOpenFinishOnboardingDialog,
    ],
  );
}
