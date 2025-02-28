import { useCallback, useState } from "react";
import { useCurrentStep } from "../../WalletSync/hooks/useCurrentStep";
import { Steps } from "../../WalletSync/types/Activation";

export function useActivationDrawer() {
  const { setCurrentStep } = useCurrentStep();
  const [isActivationDrawerVisible, setIsActivationDrawerVisible] = useState(false);

  const openActivationDrawer = useCallback(() => {
    setIsActivationDrawerVisible(true);
  }, [setIsActivationDrawerVisible]);

  const closeActivationDrawer = useCallback(() => {
    setIsActivationDrawerVisible(false);
    setCurrentStep(Steps.Activation);
  }, [setIsActivationDrawerVisible, setCurrentStep]);

  return {
    isActivationDrawerVisible,
    openActivationDrawer,
    closeActivationDrawer,
  };
}
