import { useSelector, useDispatch } from "~/context/hooks";
import { activateDrawerStepSelector } from "~/reducers/walletSync";
import { Steps } from "../types/Activation";
import { setLedgerSyncActivateStep } from "~/actions/walletSync";
import { useCallback } from "react";

export function useCurrentStep() {
  const dispatch = useDispatch();
  const currentStep = useSelector(activateDrawerStepSelector);
  const setCurrentStep = useCallback(
    (step: Steps) => {
      dispatch(setLedgerSyncActivateStep(step));
    },
    [dispatch],
  );

  return {
    currentStep,
    setCurrentStep,
  };
}
