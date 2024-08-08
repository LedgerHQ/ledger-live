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
}: Props) => {
  const { memberCredentials } = useInitMemberCredentials();

  const { handleStart, handleSendDigits, inputCallback, digits } = useSyncWithQrCode();

  const handleQrCodeScanned = (data: string) => {
    onQrCodeScanned();
    if (memberCredentials) handleStart(data, memberCredentials, setCurrentStep);
  };

  const handlePinCodeSubmit = (input: string) => {
    if (input && inputCallback && digits === input.length) handleSendDigits(inputCallback, input);
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
          />
        );

      case Steps.PinDisplay:
        return qrProcess.pinCode ? <PinCodeDisplay pinCode={qrProcess.pinCode} /> : null;

      case Steps.PinInput:
        return <PinCodeInput handleSendDigits={handlePinCodeSubmit} />;

      case Steps.SyncError:
        return <SyncError tryAgain={navigateToQrCodeMethod} />;

      default:
        return null;
    }
  };

  return getScene();
};

export default ActivationFlow;
