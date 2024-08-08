import React from "react";
import SelectAddAccountMethod from "./SelectAddAccountMethod";
import ChooseSyncMethod from "LLM/features/WalletSync/screens/Synchronize/ChooseMethod";
import QrCodeMethod from "LLM/features/WalletSync/screens/Synchronize/QrCodeMethod";
import PinCodeInput from "LLM/features/WalletSync/screens/Synchronize/PinCodeInput";
import { TrackScreen } from "~/analytics";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AnalyticsPage } from "LLM/features/WalletSync/hooks/useLedgerSyncAnalytics";
import { Options, Steps } from "LLM/features/WalletSync/types/Activation";
import SyncError from "LLM/features/WalletSync/screens/Synchronize/SyncError";
import PinCodeDisplay from "LLM/features/WalletSync/screens/Synchronize/PinCodeDisplay";

type Props = {
  currentStep: Steps;
  currency?: CryptoCurrency | TokenCurrency | null;
  doesNotHaveAccount?: boolean;
  setCurrentStep: (step: Steps) => void;
  setCurrentOption: (option: Options) => void;
  currentOption: Options;
  navigateToChooseSyncMethod: () => void;
  navigateToQrCodeMethod: () => void;
  onQrCodeScanned: (data: string) => void;
  qrProcess: {
    url: string | null;
    error: Error | null;
    isLoading: boolean;
    pinCode: string | null;
  };
};

const StepFlow = ({
  doesNotHaveAccount,
  currency,
  currentStep,
  setCurrentOption,
  currentOption,
  navigateToChooseSyncMethod,
  navigateToQrCodeMethod,
  onQrCodeScanned,
  qrProcess,
}: Props) => {
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
        return (
          <QrCodeMethod
            onQrCodeScanned={onQrCodeScanned}
            currentOption={currentOption}
            setSelectedOption={setCurrentOption}
          />
        );

      case Steps.PinDisplay:
        return qrProcess.pinCode ? <PinCodeDisplay pinCode={qrProcess.pinCode} /> : null;

      case Steps.PinInput:
        return <PinCodeInput />;

      case Steps.SyncError:
        return <SyncError tryAgain={navigateToQrCodeMethod} />;

      default:
        return null;
    }
  };

  return getScene();
};

export default StepFlow;
