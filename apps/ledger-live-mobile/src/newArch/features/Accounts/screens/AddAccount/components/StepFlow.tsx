import React, { useCallback, useEffect, useState } from "react";
import SelectAddAccountMethod from "./SelectAddAccountMethod";
import ChooseSyncMethod from "LLM/features/WalletSync/screens/Synchronize/ChooseMethod";
import QrCodeMethod from "LLM/features/WalletSync/screens/Synchronize/QrCodeMethod";
import PinCodeInput from "LLM/features/WalletSync/screens/Synchronize/PinCodeInput";
import { TrackScreen } from "~/analytics";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Steps } from "../../../types/enum/addAccount";
import { AnalyticsPage } from "LLM/features/WalletSync/hooks/useLedgerSyncAnalytics";

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

  // That means the url as be stored in the store
  const onQrCodeScanned = (data: string) => {
    console.log(data);
    // setCurrentStep(Steps.PinCodeInput);
  };

  const getScene = () => {
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
            <TrackScreen category={AnalyticsPage.ChooseSyncMethod} type="drawer" />
            <ChooseSyncMethod onScanMethodPress={navigateToQrCodeMethod} />
          </>
        );
      case Steps.QrCodeMethod:
        return <QrCodeMethod onQrCodeScanned={onQrCodeScanned} />;
      case Steps.PinCodeInput:
        return <PinCodeInput />;
      default:
        return null;
    }
  };

  return getScene();
};

export default StepFlow;
