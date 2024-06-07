import { useState } from "react";
import { useDispatch } from "react-redux";
import { setFlow } from "~/renderer/actions/walletSync";
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
      1: Step.CreateOrSynchronize,
      2: Step.DeviceAction,
      3: Step.CreateOrSynchronizeTrustChain,
      4: Step.ActivationFinal,
    },
  },
  [Flow.Synchronize]: {
    steps: {
      1: Step.SynchronizeMode,
      2: Step.SynchronizeWithQRCode,
      3: Step.PinCode,
      4: Step.Synchronized,
    },
  },
  [Flow.ManageBackups]: {
    steps: {
      1: Step.ManageBackup,
      2: Step.DeleteBackup,
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
export const STEPS_WITH_BACK: Step[] = [Step.ManageBackup, Step.DeleteBackup];

export const useFlows = ({ flow }: HookProps) => {
  const currentFlow = FlowOptions[flow];

  const maxStep = Object.keys(currentFlow.steps).length;

  const dispatch = useDispatch();
  const [currentStep, setCurrentStep] = useState(1);
  const goToNextScene = () => {
    const newStep = currentStep < maxStep ? currentStep + 1 : currentStep;
    dispatch(setFlow({ flow, step: currentFlow.steps[newStep] }));
    setCurrentStep(newStep);
  };

  const goToPreviousScene = () => {
    const newStep = currentStep > 1 ? currentStep - 1 : currentStep;
    dispatch(setFlow({ flow, step: currentFlow.steps[newStep] }));
    setCurrentStep(newStep);
  };

  const resetFlows = () => {
    dispatch(setFlow({ flow: Flow.Activation, step: Step.CreateOrSynchronize }));
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
