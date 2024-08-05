import { useCallback, useState } from "react";
import { Steps } from "../../types/Activation";
import {
  AnalyticsButton,
  AnalyticsPage,
  useLedgerSyncAnalytics,
} from "../../hooks/useLedgerSyncAnalytics";

type Props = {
  isOpen: boolean;
  startingStep: Steps;
  handleClose: () => void;
};

const useActivationDrawerModel = ({ isOpen, startingStep, handleClose }: Props) => {
  const { onClickTrack } = useLedgerSyncAnalytics();
  const [currentStep, setCurrentStep] = useState<Steps>(startingStep);

  const hasCustomHeader = currentStep === Steps.QrCodeMethod;
  const canGoBack = currentStep === Steps.ChooseSyncMethod && startingStep === Steps.Activation;

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

  const navigateToChooseSyncMethod = () => setCurrentStep(Steps.ChooseSyncMethod);

  const navigateToQrCodeMethod = () => {
    onClickTrack({
      button: AnalyticsButton.ScanQRCode,
      page: AnalyticsPage.ChooseSyncMethod,
    });
    setCurrentStep(Steps.QrCodeMethod);
  };

  // Here we retrieve the url of the trustchain from the scanned QR code on LLD
  const onQrCodeScanned = (data: string) => {
    console.log("QR code scanned", data);
    //setCurrentStep(Steps.PinCodeInput);
  };

  const resetStep = () => setCurrentStep(startingStep);
  const goBackToPreviousStep = () => setCurrentStep(getPreviousStep(currentStep));

  const onCloseDrawer = () => {
    resetStep();
    handleClose();
  };

  return {
    isOpen,
    currentStep,
    hasCustomHeader,
    canGoBack,
    navigateToChooseSyncMethod,
    navigateToQrCodeMethod,
    onQrCodeScanned,
    onCloseDrawer,
    handleClose,
    goBackToPreviousStep,
  };
};

export default useActivationDrawerModel;
