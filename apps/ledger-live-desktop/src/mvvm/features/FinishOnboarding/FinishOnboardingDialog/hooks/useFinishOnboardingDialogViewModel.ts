import { useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import {
  hidePostOnboardingWalletEntryPoint,
  postOnboardingSetFinished,
} from "@ledgerhq/live-common/postOnboarding/actions";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { setHasRedirectedToPostOnboarding } from "~/renderer/actions/settings";
import { track } from "~/renderer/analytics/segment";
import {
  closeFinishPostOnboarding,
  selectIsFinishPostOnboardingOpen,
} from "LLD/features/FinishOnboarding/FinishOnboardingDialog/finishOnboardingDialog";
import { useFinishOnboardingState } from "LLD/features/FinishOnboarding/hooks/useFinishOnboardingState";
import type { FinishOnboardingStep } from "LLD/features/FinishOnboarding/hooks/types";

export type FinishOnboardingDialogAction = FinishOnboardingStep;

export interface FinishOnboardingDialogViewProps {
  readonly allStepsCompleted: boolean;
  readonly steps: FinishOnboardingDialogAction[];
  readonly completedStepsAmount: number;
  readonly totalStepsAmount: number;
  readonly deviceModelId: DeviceModelId | null;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onGotIt: () => void;
  readonly onGotItLabel: string;
  readonly title: string;
}

/**
 * Open/close is driven by the global `dialogs` slice (see `finishOnboardingDialog.ts`); the widget
 * dispatches `openFinishPostOnboarding` via `useFinishOnboardingDialog`.
 */
export default function useFinishOnboardingDialogViewModel(): FinishOnboardingDialogViewProps {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const isDialogOpen = useSelector(selectIsFinishPostOnboardingOpen);

  const {
    steps,
    deviceModelId,
    allStepsCompleted,
    completedStepsAmount,
    totalStepsAmount,
    postOnboardingInProgress,
  } = useFinishOnboardingState();

  useEffect(() => {
    if (!postOnboardingInProgress || !allStepsCompleted) return;
    track("Post-onboarding widget completed", {
      deviceModelId,
      flow: "post-onboarding",
    });
    if (isDialogOpen) {
      dispatch(closeFinishPostOnboarding());
    }
    dispatch(hidePostOnboardingWalletEntryPoint());
    dispatch(postOnboardingSetFinished());
  }, [allStepsCompleted, deviceModelId, dispatch, isDialogOpen, postOnboardingInProgress]);

  useEffect(() => {
    if (isDialogOpen) {
      dispatch(setHasRedirectedToPostOnboarding(true));
    }
  }, [dispatch, isDialogOpen]);

  const onGotIt = useCallback(() => {
    track("button_clicked2", {
      button: "Got it",
      deviceModelId,
      flow: "post-onboarding",
    });
    dispatch(closeFinishPostOnboarding());
    dispatch(hidePostOnboardingWalletEntryPoint());
  }, [deviceModelId, dispatch]);

  const onClose = useCallback(() => {
    track("button_clicked2", {
      button: "Close",
      deviceModelId,
      flow: "post-onboarding",
    });
    dispatch(closeFinishPostOnboarding());
  }, [deviceModelId, dispatch]);

  return useMemo(
    () => ({
      allStepsCompleted,
      steps,
      completedStepsAmount,
      deviceModelId,
      isOpen: isDialogOpen,
      onClose,
      onGotIt,
      onGotItLabel: t("postOnboarding.dialog.primaryLabel"),
      title: t("postOnboarding.dialog.title"),
      totalStepsAmount,
    }),
    [
      allStepsCompleted,
      completedStepsAmount,
      deviceModelId,
      isDialogOpen,
      onClose,
      onGotIt,
      steps,
      t,
      totalStepsAmount,
    ],
  );
}
