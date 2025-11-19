import { useCallback, useState } from "react";
import { SEND_STEP, SendStep } from "../domain";

type UseSendNavigationReturn = {
  step: SendStep;
  shouldShowNetworkStep: boolean;
  goToAsset: () => void;
  goToNetwork: () => void;
  goToAccount: (options?: { viaNetwork?: boolean }) => void;
  goToSend: () => void;
  handleBackFromAccount: () => void;
};

export const useSendNavigation = (hasPreselectedAccount: boolean): UseSendNavigationReturn => {
  const [step, setStep] = useState<SendStep>(
    hasPreselectedAccount ? SEND_STEP.RECIPIENT : SEND_STEP.ASSET,
  );
  const [shouldShowNetworkStep, setShouldShowNetworkStep] = useState(false);

  const goToAsset = useCallback(() => {
    setStep(SEND_STEP.ASSET);
    setShouldShowNetworkStep(false);
  }, []);

  const goToNetwork = useCallback(() => {
    setStep(SEND_STEP.NETWORK);
    setShouldShowNetworkStep(true);
  }, []);

  const goToAccount = useCallback((options?: { viaNetwork?: boolean }) => {
    setStep(SEND_STEP.ACCOUNT);
    if (options?.viaNetwork !== undefined) {
      setShouldShowNetworkStep(options.viaNetwork);
    }
  }, []);

  const goToSend = useCallback(() => {
    setStep(SEND_STEP.RECIPIENT);
  }, []);

  const handleBackFromAccount = useCallback(() => {
    setStep(shouldShowNetworkStep ? SEND_STEP.NETWORK : SEND_STEP.ASSET);
  }, [shouldShowNetworkStep]);

  return {
    step,
    shouldShowNetworkStep,
    goToAsset,
    goToNetwork,
    goToAccount,
    goToSend,
    handleBackFromAccount,
  };
};
