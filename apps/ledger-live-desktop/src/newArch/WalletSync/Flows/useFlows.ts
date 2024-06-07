import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setFlow } from "~/renderer/actions/walletSync";
import {
  Flow,
  Step,
  walletSyncFlowSelector,
  walletSyncStepSelector,
} from "~/renderer/reducers/walletSync";

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
    steps: {
      1: Step.SynchronizedInstances,
      2: Step.DeviceActionInstance,
      3: Step.DeleteInstanceWithTrustChain,
      4: Step.InstanceSuccesfullyDeleted,
      5: Step.InstanceErrorDeletion,
      6: Step.UnsecuredLedger,
    },
  },
};

/**
 *
 * STEPS_WITH_BACK is used to determine whether a back button should be displayed in the WalletSyncRow  component,
 * depending on the current step and the current flow.
 *
 */
export const STEPS_WITH_BACK: Step[] = [
  Step.ManageBackup,
  Step.DeleteBackup,
  Step.SynchronizedInstances,
];

export const useFlows = ({ flow }: HookProps) => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (flow) {
      dispatch(setFlow({ flow, step: FlowOptions[flow].steps[1] }));
    }
  }, [dispatch, flow]);

  const currentFlow = useSelector(walletSyncFlowSelector);
  const currentStep = useSelector(walletSyncStepSelector);

  const steps = FlowOptions[currentFlow].steps;
  const maxStep = Object.keys(steps).length;

  const goToNextScene = () => {
    const currentIndex = Object.values(steps).findIndex(step => step === currentStep) + 1;
    const newStep = currentIndex < maxStep ? currentIndex + 1 : currentIndex;
    console.log("currentIndex", currentIndex);
    console.log("newStep", newStep);
    dispatch(setFlow({ flow, step: steps[newStep] }));
  };

  const goToPreviousScene = () => {
    const currentIndex = Object.values(steps).findIndex(step => step === currentStep) + 1;
    const newStep = currentIndex > 1 ? currentIndex - 1 : currentIndex;
    dispatch(setFlow({ flow, step: steps[newStep] }));
  };

  const resetFlows = () => {
    dispatch(setFlow({ flow: Flow.Activation, step: Step.CreateOrSynchronize }));
  };

  return {
    currentFlow,
    currentStep,
    goToNextScene,
    goToPreviousScene,
    FlowOptions,
    resetFlows,
  };
};
