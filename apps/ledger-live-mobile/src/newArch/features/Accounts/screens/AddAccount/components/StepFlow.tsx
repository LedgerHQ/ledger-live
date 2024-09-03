import React from "react";
import SelectAddAccountMethod from "./SelectAddAccountMethod";
import ChooseSyncMethod from "LLM/features/WalletSync/screens/Synchronize/ChooseMethod";
import QrCodeMethod from "LLM/features/WalletSync/screens/Synchronize/QrCodeMethod";
import { TrackScreen } from "~/analytics";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AnalyticsPage } from "LLM/features/WalletSync/hooks/useLedgerSyncAnalytics";
import { Options, Steps } from "LLM/features/WalletSync/types/Activation";
import SyncError from "LLM/features/WalletSync/screens/Synchronize/SyncError";
import PinCodeDisplay from "LLM/features/WalletSync/screens/Synchronize/PinCodeDisplay";
import PinCodeInput from "LLM/features/WalletSync/screens/Synchronize/PinCodeInput";
import { useInitMemberCredentials } from "LLM/features/WalletSync/hooks/useInitMemberCredentials";
import { useSyncWithQrCode } from "LLM/features/WalletSync/hooks/useSyncWithQrCode";
import { SpecificError } from "~/newArch/features/WalletSync/components/Error/SpecificError";
import { ErrorReason } from "~/newArch/features/WalletSync/hooks/useSpecificError";

type Props = {
  currentStep: Steps;
  currency?: CryptoCurrency | TokenCurrency | null;
  doesNotHaveAccount?: boolean;
  setCurrentStep: (step: Steps) => void;
  setCurrentOption: (option: Options) => void;
  currentOption: Options;
  navigateToChooseSyncMethod: () => void;
  navigateToQrCodeMethod: () => void;
  onCreateKey: () => void;
  onQrCodeScanned: () => void;
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
  setCurrentStep,
  onCreateKey,
}: Props) => {
  const { memberCredentials } = useInitMemberCredentials();

  const { handleStart, handleSendDigits, inputCallback, nbDigits } = useSyncWithQrCode();

  const handleQrCodeScanned = (data: string) => {
    onQrCodeScanned();
    if (memberCredentials) handleStart(data, memberCredentials, setCurrentStep);
  };

  const handlePinCodeSubmit = (input: string) => {
    if (input && inputCallback && nbDigits === input.length) handleSendDigits(inputCallback, input);
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
        return (
          <QrCodeMethod
            onQrCodeScanned={handleQrCodeScanned}
            currentOption={currentOption}
            setSelectedOption={setCurrentOption}
          />
        );

      case Steps.PinDisplay:
        return qrProcess.pinCode ? <PinCodeDisplay pinCode={qrProcess.pinCode} /> : null;

      case Steps.PinInput:
        return nbDigits ? (
          <PinCodeInput handleSendDigits={handlePinCodeSubmit} nbDigits={nbDigits} />
        ) : null;

      case Steps.SyncError:
        return <SyncError tryAgain={navigateToQrCodeMethod} />;

      case Steps.UnbackedError:
        return <SpecificError primaryAction={onCreateKey} error={ErrorReason.NO_BACKUP} />;

      case Steps.AlreadyBacked:
        return (
          <SpecificError
            primaryAction={() => setCurrentStep(Steps.QrCodeMethod)}
            error={ErrorReason.ALREADY_BACKED_SCAN}
          />
        );

      case Steps.BackedWithDifferentSeeds:
        return (
          <SpecificError
            primaryAction={() => setCurrentStep(Steps.QrCodeMethod)}
            error={ErrorReason.DIFFERENT_BACKUPS}
          />
        );
      default:
        return null;
    }
  };

  return getScene();
};

export default StepFlow;
