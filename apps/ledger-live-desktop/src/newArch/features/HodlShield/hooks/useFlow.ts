import { useDispatch, useSelector } from "react-redux";
import { setFlow } from "~/renderer/actions/hodlShield";
import {
  Flow,
  Step,
  hodlShieldFlowSelector,
  hodlShieldStepSelector,
} from "~/renderer/reducers/hodlShield";

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
      3: Step.ActivationLoading,
      4: Step.ActivationFinal,
    },
  },
};

export const useFlows = () => {
  const dispatch = useDispatch();
  const currentFlow = useSelector(hodlShieldFlowSelector);
  const currentStep = useSelector(hodlShieldStepSelector);

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
    dispatch(setFlow({ flow: Flow.Activation, step: Step.CreateOrSynchronize }));
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
