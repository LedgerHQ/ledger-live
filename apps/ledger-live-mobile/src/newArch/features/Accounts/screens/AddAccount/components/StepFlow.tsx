import React, { useCallback, useEffect, useState } from "react";
import SelectAddAccountMethod from "./SelectAddAccountMethod";
import ChooseSyncMethod from "LLM/features/WalletSync/screens/Synchronize/ChooseMethod";
import QrCodeMethod from "LLM/features/WalletSync/screens/Synchronize/QrCodeMethod";
import { TrackScreen } from "~/analytics";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Steps } from "../../../types/enum/addAccount";

type Props = {
  startingStep: Steps;
  currency?: CryptoCurrency | TokenCurrency | null;
  doesNotHaveAccount?: boolean;
  onStepChange?: (step: Steps) => void;
  onGoBack?: (callback: () => void) => void;
};

const StepFlow = ({
  startingStep,
  doesNotHaveAccount,
  currency,
  onGoBack,
  onStepChange,
}: Props) => {
  const [currentStep, setCurrentStep] = useState<Steps>(startingStep);

  useEffect(() => {
    if (onStepChange) onStepChange(currentStep);
  }, [currentStep, onStepChange]);

  const navigateToChooseSyncMethod = () => setCurrentStep(Steps.ChooseSyncMethod);
  const navigateToQrCodeMethod = () => setCurrentStep(Steps.QrCodeMethod);

  const getPreviousStep = useCallback(
    (step: Steps): Steps => {
      switch (step) {
        case Steps.QrCodeMethod:
          return Steps.ChooseSyncMethod;
        case Steps.ChooseSyncMethod:
          return Steps.AddAccountMethod;
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
    case Steps.AddAccountMethod:
      return (
        <>
          <TrackScreen category="Add/Import accounts" type="drawer" />
          <SelectAddAccountMethod
            doesNotHaveAccount={doesNotHaveAccount}
            currency={currency}
            setWalletSyncDrawerVisible={navigateToChooseSyncMethod}
          />
        </>
      );
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

export default StepFlow;
