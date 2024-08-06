import { useCallback, useState } from "react";
import { track } from "~/analytics";
import { useQRCodeHost } from "~/newArch/features/WalletSync/hooks/useQRCodeHost";
import { Options, Steps } from "~/newArch/features/WalletSync/types/Activation";

type AddAccountDrawerProps = {
  isOpened: boolean;
  onClose: () => void;
};

const startingStep = Steps.AddAccountMethod;

const useAddAccountViewModel = ({ isOpened, onClose }: AddAccountDrawerProps) => {
  const [currentStep, setCurrentStep] = useState<Steps>(startingStep);
  const [currentOption, setCurrentOption] = useState<Options>(Options.SCAN);

  const navigateToChooseSyncMethod = () => setCurrentStep(Steps.ChooseSyncMethod);
  const navigateToQrCodeMethod = () => setCurrentStep(Steps.QrCodeMethod);

  const onGoBack = () => setCurrentStep(prevStep => getPreviousStep(prevStep));

  const reset = () => {
    setCurrentStep(startingStep);
    setCurrentOption(Options.SCAN);
  };

  const getPreviousStep = useCallback((step: Steps): Steps => {
    switch (step) {
      case Steps.QrCodeMethod:
        return Steps.ChooseSyncMethod;
      case Steps.ChooseSyncMethod:
        return Steps.AddAccountMethod;
      default:
        return startingStep;
    }
  }, []);

  const trackButtonClick = useCallback((button: string) => {
    track("button_clicked", {
      button,
      drawer: "AddAccountsModal",
    });
  }, []);

  const onCloseAddAccountDrawer = useCallback(() => {
    trackButtonClick("Close 'x'");
    onClose();
    reset();
  }, [trackButtonClick, onClose]);

  const { url, error, isLoading, pinCode } = useQRCodeHost({
    setCurrentStep,
    currentStep,
    currentOption,
  });

  return {
    isAddAccountDrawerVisible: isOpened,
    onCloseAddAccountDrawer,
    navigateToQrCodeMethod,
    navigateToChooseSyncMethod,
    currentStep,
    setCurrentOption,
    currentOption,
    setCurrentStep,
    onGoBack,
    qrProcess: {
      url,
      error,
      isLoading,
      pinCode,
    },
  };
};

export default useAddAccountViewModel;
