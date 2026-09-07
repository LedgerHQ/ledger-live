import { useCallback, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  useGetCardOnboardingStatusQuery,
  type PayCardOnboardingStep,
} from "@domain/api-card-management";
import { markCardOnboardingCompleted, selectHasCompletedCardOnboarding } from "../../state";

export type CardOnboardingViewModelResult = {
  readonly isOpen: boolean;
  readonly steps: PayCardOnboardingStep[];
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

const NO_STEPS: readonly PayCardOnboardingStep[] = [];

export function useCardOnboardingViewModel(): CardOnboardingViewModelResult {
  const [isOpen, setIsOpen] = useState(false);
  const { data, isLoading, isError } = useGetCardOnboardingStatusQuery();
  const dispatch = useDispatch();
  const hasCompletedOnboarding = useSelector(selectHasCompletedCardOnboarding);

  const steps = useMemo(() => data?.steps ?? NO_STEPS, [data]);
  const completedCount = useMemo(() => steps.filter(s => s.isDone).length, [steps]);
  const totalCount = steps.length;
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
