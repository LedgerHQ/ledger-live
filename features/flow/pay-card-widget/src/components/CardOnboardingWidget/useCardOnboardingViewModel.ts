import { useCallback, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { trackCardOnboardingWidgetToggled } from "@features/platform-pay-analytics";
import { markCardOnboardingCompleted, selectHasCompletedCardOnboarding } from "../../state";
import { useCardOnboardingStatus } from "../../onboardingStatus";
import { useOnboardingSteps, type CardOnboardingStepWithCopy } from "./useOnboardingSteps";

export type CardOnboardingViewModelResult = {
  readonly isOpen: boolean;
  readonly steps: CardOnboardingStepWithCopy[];
  readonly completedCount: number;
  readonly totalCount: number;
  readonly onboardingCompleted: boolean;
  readonly hasCompletedOnboarding: boolean;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly handleOpen: () => void;
  readonly handleClose: () => void;
  readonly handleGotIt: () => void;
};

export function useCardOnboardingViewModel(): CardOnboardingViewModelResult {
  const [isOpen, setIsOpen] = useState(false);
  const { data, isLoading, isError } = useCardOnboardingStatus();
  const dispatch = useDispatch();
  const hasCompletedOnboarding = useSelector(selectHasCompletedCardOnboarding);

  const steps = useOnboardingSteps(data.steps);
  const completedCount = data.completedCount;
  const totalCount = data.steps.length;
  const onboardingCompleted = totalCount > 0 && completedCount === totalCount;
  const stepDone = useCallback(
    (id: string) => data.steps.find(step => step.id === id)?.isDone ?? false,
    [data.steps],
  );
  const trackingProperties = useMemo(
    () => ({
      page: "Pay",
      cardClaimed: stepDone("choose-card-type"),
      addedToOsWallet: stepDone("apple-google-pay"),
      cardTopUp: stepDone("top-up-card"),
      firstPurchaseCompleted: stepDone("first-purchase"),
    }),
    [stepDone],
  );

  const handleOpen = useCallback(() => {
    trackCardOnboardingWidgetToggled({
      opened: true,
      ...trackingProperties,
    });
    setIsOpen(true);
  }, [trackingProperties]);
  const handleClose = useCallback(() => {
    trackCardOnboardingWidgetToggled({
      opened: false,
      ...trackingProperties,
    });
    setIsOpen(false);
  }, [trackingProperties]);
  const handleGotIt = useCallback(() => {
    dispatch(markCardOnboardingCompleted());
    handleClose();
  }, [dispatch, handleClose]);

  return useMemo(
    () => ({
      isOpen,
      steps: [...steps],
      completedCount,
      totalCount,
      onboardingCompleted,
      hasCompletedOnboarding,
      isLoading,
      isError,
      handleOpen,
      handleClose,
      handleGotIt,
    }),
    [
      isOpen,
      steps,
      completedCount,
      totalCount,
      onboardingCompleted,
      hasCompletedOnboarding,
      isLoading,
      isError,
      handleOpen,
      handleClose,
      handleGotIt,
    ],
  );
}
