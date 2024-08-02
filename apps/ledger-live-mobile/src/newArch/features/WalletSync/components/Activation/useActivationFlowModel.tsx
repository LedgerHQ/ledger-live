import { useCallback, useEffect, useState } from "react";
import { Steps } from "../../types/Activation";
import {
  AnalyticsButton,
  AnalyticsPage,
  useWalletSyncAnalytics,
} from "../../hooks/useWalletSyncAnalytics";

type UseActivationFlowProps = {
  startingStep: Steps;
  onStepChange?: (step: Steps) => void;
  onGoBack?: (callback: () => void) => void;
};

const useActivationFlow = ({ startingStep, onStepChange, onGoBack }: UseActivationFlowProps) => {
  const [currentStep, setCurrentStep] = useState<Steps>(startingStep);
  const { onClickTrack } = useWalletSyncAnalytics();

  useEffect(() => {
    if (onStepChange) onStepChange(currentStep);
  }, [currentStep, onStepChange]);

  const navigateToChooseSyncMethod = () => setCurrentStep(Steps.ChooseSyncMethod);

  const navigateToQrCodeMethod = () => {
    onClickTrack({
      button: AnalyticsButton.ScanQRCode,
      page: AnalyticsPage.ChooseSyncMethod,
    });
    setCurrentStep(Steps.QrCodeMethod);
  };

  const getPreviousStep = useCallback(
    (step: Steps): Steps => {
      switch (step) {
        case Steps.ChooseSyncMethod:
          return Steps.Activation;
        case Steps.QrCodeMethod:
          return Steps.ChooseSyncMethod;
        default:
          return startingStep;
      }
    },
    [startingStep],
  );

  useEffect(() => {
    if (onGoBack) onGoBack(() => setCurrentStep(prevStep => getPreviousStep(prevStep)));
  }, [getPreviousStep, onGoBack]);

  return {
    currentStep,
    navigateToChooseSyncMethod,
    navigateToQrCodeMethod,
  };
};

export default useActivationFlow;
