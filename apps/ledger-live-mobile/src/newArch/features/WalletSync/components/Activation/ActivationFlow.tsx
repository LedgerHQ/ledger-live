import React from "react";
import Activation from ".";
import { TrackScreen } from "~/analytics";
import ChooseSyncMethod from "../../screens/Synchronize/ChooseMethod";
import QrCodeMethod from "../../screens/Synchronize/QrCodeMethod";
import { Options, Steps } from "../../types/Activation";
import { AnalyticsPage } from "../../hooks/useLedgerSyncAnalytics";
import PinCodeDisplay from "../../screens/Synchronize/PinCodeDisplay";
import PinCodeInput from "../../screens/Synchronize/PinCodeInput";
import SyncError from "../../screens/Synchronize/SyncError";
import { useInitMemberCredentials } from "../../hooks/useInitMemberCredentials";
import { useSyncWithQrCode } from "../../hooks/useSyncWithQrCode";
import { SpecificError } from "../Error/SpecificError";
import { ErrorReason } from "../../hooks/useSpecificError";

type Props = {
  currentStep: Steps;
  navigateToChooseSyncMethod: () => void;
  navigateToQrCodeMethod: () => void;
  qrProcess: {
    url: string | null;
    error: Error | null;
    isLoading: boolean;
    pinCode: string | null;
  };
  onQrCodeScanned: () => void;
  currentOption: Options;
  setOption: (option: Options) => void;
  setCurrentStep: (step: Steps) => void;
  onCreateKey: () => void;
};

const ActivationFlow = ({
  currentStep,
  navigateToChooseSyncMethod,
  navigateToQrCodeMethod,
  qrProcess,
  currentOption,
  setOption,
  onQrCodeScanned,
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
      case Steps.Activation:
        return (
          <>
            <TrackScreen category={AnalyticsPage.ActivateLedgerSync} />
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
        return (
          <QrCodeMethod
            onQrCodeScanned={handleQrCodeScanned}
            currentOption={currentOption}
            setSelectedOption={setOption}
            qrCodeValue={qrProcess.url}
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

export default ActivationFlow;
