import React from "react";
import Activation from ".";
import { TrackScreen } from "~/analytics";
import ChooseSyncMethod from "../../screens/Synchronize/ChooseMethod";
import QrCodeMethod from "../../screens/Synchronize/QrCodeMethod";
import PinCodeInput from "../../screens/Synchronize/PinCodeInput";
import { Steps } from "../../types/Activation";
import { AnalyticsPage } from "../../hooks/useLedgerSyncAnalytics";
import { useInitMemberCredentials } from "../../hooks/useInitMemberCredentials";
import { useSyncWithQrCode } from "../../hooks/useSyncWithQrCode";

type Props = {
  currentStep: Steps;
  navigateToChooseSyncMethod: () => void;
  navigateToQrCodeMethod: () => void;
  onQrCodeScanned: () => void;
};

const ActivationFlow = ({
  currentStep,
  navigateToChooseSyncMethod,
  navigateToQrCodeMethod,
  onQrCodeScanned,
}: Props) => {
  const { memberCredentials } = useInitMemberCredentials();

  const { handleStart, handleSendDigits, inputCallback, digits } = useSyncWithQrCode();

  const handleQrCodeScanned = (data: string) => {
    onQrCodeScanned();
    if (memberCredentials) handleStart(data, memberCredentials);
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
        return <QrCodeMethod onQrCodeScanned={handleQrCodeScanned} />;
      case Steps.PinCodeInput:
        return <PinCodeInput handleSendDigits={handlePinCodeSubmit} />;
      default:
        return null;
    }
  };

  return getScene();
};

export default ActivationFlow;
