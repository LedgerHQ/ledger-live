import React, { useCallback, useEffect, useState } from "react";
import Activation from ".";
import { TrackScreen } from "~/analytics";
import ChooseSyncMethod from "../../screens/Synchronize/ChooseMethod";
import QrCodeMethod from "../../screens/Synchronize/QrCodeMethod";
import { Steps } from "../../types/Activation";
import {
  AnalyticsButton,
  AnalyticsPage,
  useWalletSyncAnalytics,
} from "../../hooks/useWalletSyncAnalytics";

type Props = {
  startingStep: Steps;
  onStepChange?: (step: Steps) => void;
  onGoBack?: (callback: () => void) => void;
};

const ActivationFlow = ({ startingStep, onStepChange, onGoBack }: Props) => {
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

  const getScene = () => {
    switch (currentStep) {
      case Steps.Activation:
        return (
          <>
            <TrackScreen category={AnalyticsPage.ActivateWalletSync} />
            <Activation onSyncMethodPress={navigateToChooseSyncMethod} />
          </>
        );
      case Steps.ChooseSyncMethod:
        return (
          <>
            <TrackScreen category={AnalyticsPage.ChooseSyncMethod} />
            <ChooseSyncMethod onScanMethodPress={navigateToQrCodeMethod} />
          </>
        );
      case Steps.QrCodeMethod:
        return <QrCodeMethod />;
      default:
        return null;
    }
  };

  return getScene();
};

export default ActivationFlow;
