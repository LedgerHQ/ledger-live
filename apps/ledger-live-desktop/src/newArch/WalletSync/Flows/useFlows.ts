import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setFlow } from "~/renderer/actions/walletSync";
import {
  Flow,
  Step,
  walletSyncFakedSelector,
  walletSyncFlowSelector,
  walletSyncStateSelector,
  walletSyncStepSelector,
} from "~/renderer/reducers/walletSync";

export type HookProps = {
  flow?: Flow;
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
  [Flow.walletSyncActivated]: {
    steps: {
      1: Step.walletSyncActivated,
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

  const hasBeenFaked = useSelector(walletSyncFakedSelector);

  useEffect(() => {
    if (flow && !hasBeenFaked) {
      dispatch(setFlow({ flow, step: FlowOptions[flow].steps[1] }));
    }
  }, [dispatch, flow, hasBeenFaked]);

  const walletSyncActivated = useSelector(walletSyncStateSelector);
  const currentFlow = useSelector(walletSyncFlowSelector);
  const currentStep = useSelector(walletSyncStepSelector);

  const stepsRecord = FlowOptions[currentFlow].steps;
  const maxStep = Object.keys(stepsRecord).length;

  const findIndex = (step: Step) => Object.values(stepsRecord).findIndex(s => s === step);

  const goToNextScene = () => {
    const currentIndex = findIndex(currentStep) + 1;
    const newStep = currentIndex < maxStep ? currentIndex + 1 : currentIndex;
    dispatch(setFlow({ flow: currentFlow, step: stepsRecord[newStep] }));
  };
  const goToPreviousScene = () => {
    const currentIndex = findIndex(currentStep) + 1;
    const newStep = currentIndex > 1 ? currentIndex - 1 : currentIndex;
    dispatch(setFlow({ flow: currentFlow, step: stepsRecord[newStep] }));
  };

  const goToWelcomeScreenWalletSync = () => {
    if (walletSyncActivated) {
      dispatch(setFlow({ flow: Flow.walletSyncActivated, step: Step.walletSyncActivated }));
    } else {
      dispatch(setFlow({ flow: Flow.Activation, step: Step.CreateOrSynchronize }));
    }
  };

  return {
    currentFlow,
    currentStep,
    goToNextScene,
    goToPreviousScene,
    FlowOptions,
    goToWelcomeScreenWalletSync,
  };
};
