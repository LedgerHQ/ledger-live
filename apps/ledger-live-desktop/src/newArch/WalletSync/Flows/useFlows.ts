import { useState } from "react";
import { useDispatch } from "react-redux";
import { setFlow, setStep } from "~/renderer/actions/walletSync";
import { Flow, Step } from "~/renderer/reducers/walletSync";

export type HookProps = {
  flow: Flow;
};

export const FlowOptions: Record<
  Flow,
  {
    steps: Record<number, Step>;
  }
> = {
  [Flow.Activation]: {
    steps: {
      1: Step.CreateOrSynchronizeStep,
      2: Step.DeviceActionStep,
      3: Step.ActivationFinalStep,
    },
  },
  [Flow.Synchronize]: {
    steps: {},
  },
  [Flow.ManageBackups]: {
    steps: {
      1: Step.ManageBackupStep,
      2: Step.DeleteBackupStep,
      3: Step.BackupDeleted,
    },
  },
  [Flow.ManageInstances]: {
    steps: {},
  },
};

/**
 *
 * STEPS_WITH_BACK is used to determine whether a back button should be displayed in the WalletSyncRow  component,
 * depending on the current step and the current flow.
 *
 */
export const STEPS_WITH_BACK: Step[] = [Step.ManageBackupStep, Step.DeleteBackupStep];

export const useFlows = ({ flow }: HookProps) => {
  const currentFlow = FlowOptions[flow];

  const maxStep = Object.keys(currentFlow.steps).length;

  const dispatch = useDispatch();
  const [currentStep, setCurrentStep] = useState(1);
  const goToNextScene = () => {
    const newStep = currentStep < maxStep ? currentStep + 1 : currentStep;

    dispatch(setStep(currentFlow.steps[newStep]));
    setCurrentStep(newStep);
  };

  const goToPreviousScene = () => {
    const newStep = currentStep > 1 ? currentStep - 1 : currentStep;
    dispatch(setStep(currentFlow.steps[newStep]));
    setCurrentStep(newStep);
  };

  const resetFlows = () => {
    dispatch(setFlow(Flow.Activation));
    dispatch(setStep(Step.CreateOrSynchronizeStep));
  };

  return {
    currentFlow,
    currentStep: currentFlow.steps[currentStep],
    goToNextScene,
    goToPreviousScene,
    setCurrentStep,
    FlowOptions,
    resetFlows,
  };
};
