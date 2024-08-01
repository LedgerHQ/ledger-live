import React, { useCallback, useEffect, useState } from "react";
import Activation from ".";
import { TrackScreen } from "~/analytics";
import ChooseSyncMethod from "../../screens/Synchronize/ChooseMethod";
import QrCodeMethod from "../../screens/Synchronize/QrCodeMethod";
import { Steps } from "../../types/Activation";

type Props = {
  startingStep: Steps;
  onStepChange?: (step: Steps) => void;
  onGoBack?: (callback: () => void) => void;
};

const ActivationFlow = ({ startingStep, onStepChange, onGoBack }: Props) => {
  const [currentStep, setCurrentStep] = useState<Steps>(startingStep);

  useEffect(() => {
    if (onStepChange) onStepChange(currentStep);
  }, [currentStep, onStepChange]);

  const navigateToChooseSyncMethod = () => setCurrentStep(Steps.ChooseSyncMethod);
  const navigateToQrCodeMethod = () => setCurrentStep(Steps.QrCodeMethod);

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

  switch (currentStep) {
    case Steps.Activation:
      return <Activation onSyncMethodPress={navigateToChooseSyncMethod} />;
    case Steps.ChooseSyncMethod:
      return (
        <>
          <TrackScreen category="Choose sync method" type="drawer" />
          <ChooseSyncMethod onScanMethodPress={navigateToQrCodeMethod} />
        </>
      );
    case Steps.QrCodeMethod:
      return <QrCodeMethod />;
    default:
      return null;
  }
};

export default ActivationFlow;
