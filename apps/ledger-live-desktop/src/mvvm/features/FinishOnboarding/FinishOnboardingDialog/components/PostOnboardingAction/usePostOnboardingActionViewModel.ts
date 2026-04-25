import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { useDispatch } from "LLD/hooks/redux";
import { closeFinishPostOnboarding } from "LLD/features/FinishOnboarding/FinishOnboardingDialog/finishOnboardingDialog";
import { EntryPoint } from "LLD/features/LedgerSyncEntryPoints/types";
import useLedgerSyncEntryPointViewModel from "LLD/features/LedgerSyncEntryPoints/useLedgerSyncEntryPointViewModel";
import { openModal } from "~/renderer/actions/modals";
import { track } from "~/renderer/analytics/segment";
import { useCompleteActionCallback } from "~/renderer/components/PostOnboardingHub/logic/useCompleteAction";
import { AllModalNames } from "~/renderer/modals/types";
import type { PostOnboardingActionProps, PostOnboardingActionViewProps } from "./types";
import { DeviceModelId } from "@ledgerhq/devices";

const DEFAULT_TEST_ID = "post-onboarding-action";

export function usePostOnboardingActionViewModel(
  props: PostOnboardingActionProps,
): PostOnboardingActionViewProps {
  const {
    buttonLabelForAnalyticsEvent,
    completed,
    description,
    deviceModelId,
    lumenSymbol,
    postOnboardingActionId,
    shouldCompleteOnStart,
    getIsAlreadyCompletedByState,
    isLedgerSyncActive,
    accounts,
    startAction,
    testId = DEFAULT_TEST_ID,
    title,
  } = props;

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const recoverServices = useFeature("protectServicesDesktop");
  const protectId = recoverServices?.params?.protectId ?? "protect-prod";
  const { openDrawer: openActivationDrawer } = useLedgerSyncEntryPointViewModel({
    entryPoint: EntryPoint.postOnboarding,
    needEligibleDevice: true,
  });

  const [isActionCompleted, setIsActionCompleted] = useState(false);
  const initIsActionCompleted = useCallback(async () => {
    const isAlreadyCompleted = getIsAlreadyCompletedByState?.({ isLedgerSyncActive, accounts });
    setIsActionCompleted(completed || !!isAlreadyCompleted);
  }, [setIsActionCompleted, completed, getIsAlreadyCompletedByState, isLedgerSyncActive, accounts]);

  useEffect(() => {
    initIsActionCompleted();
  }, [initIsActionCompleted]);
  const completeAction = useCompleteActionCallback();

  const handleStartAction = useCallback(() => {
    const openModalCallback = (modalName: AllModalNames) => {
      dispatch(openModal(modalName, { isFromPostOnboardingEntryPoint: true }));
    };
    const navigationCallback = (location: Record<string, unknown> | string) => {
      navigate(location);
    };
    if (deviceModelId !== null) {
      startAction({
        openModalCallback,
        navigationCallback,
        deviceModelId,
        openActivationDrawer,
        protectId,
      });
      if (buttonLabelForAnalyticsEvent) {
        track("button_clicked2", {
          button: buttonLabelForAnalyticsEvent,
          deviceModelId,
          flow: "post-onboarding",
        });
      }
    }
    if (shouldCompleteOnStart) { completeAction(postOnboardingActionId); }
  }, [
    buttonLabelForAnalyticsEvent,
    completeAction,
    deviceModelId,
    dispatch,
    navigate,
    openActivationDrawer,
    postOnboardingActionId,
    protectId,
    shouldCompleteOnStart,
    startAction,
  ]);

  const onRowActivate = useCallback(() => {
    if (completed) return;
    handleStartAction();
    dispatch(closeFinishPostOnboarding());
  }, [completed, dispatch, handleStartAction]);

  return useMemo(
    () => ({
      completed: isActionCompleted,
      description,
      lumenSymbol,
      onRowActivate,
      postOnboardingActionId,
      testId,
      title,
    }),
    [
      isActionCompleted,
      description,
      lumenSymbol,
      onRowActivate,
      postOnboardingActionId,
      testId,
      title,
    ],
  );
}
