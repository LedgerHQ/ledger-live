import { useCallback, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
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

  const handleOpen = useCallback(() => setIsOpen(true), []);
  const handleClose = useCallback(() => setIsOpen(false), []);
  const handleGotIt = useCallback(() => {
    dispatch(markCardOnboardingCompleted());
    setIsOpen(false);
  }, [dispatch]);

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
